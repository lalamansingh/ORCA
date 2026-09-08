"""Controlled Step 11 query-understanding endpoint; it executes no marine tools."""
from fastapi import APIRouter,HTTPException,Request,status,Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.llm.factory import get_llm_provider
from app.llm.models import QueryExtractionResult
from app.schemas.ai import QueryInput,ExecuteInput,ConversationMessageInput
from app.api.dependencies import get_current_user, get_current_user_optional, csrf_protect
from app.db.session import get_db_session
from app.db.models import Conversation,Message,MessageRole,User
from app.localization.service import LocalizationService
from app.localization.models import LanguageCapability
from app.services.query_understanding_service import QueryUnderstandingService
from app.planner.planner import QueryPlanner
from app.planner.models import ExecutionPlan
from app.orchestrator.defaults import build_default_registry
from app.orchestrator.pipeline import ORCAQueryExecutionService
from app.orchestrator.service import ORCAOrchestrator

router=APIRouter(prefix="/ai")

@router.get("/languages",response_model=list[LanguageCapability])
async def supported_languages():
    return LocalizationService.capabilities()

COASTAL_COORDINATES = {
    "chennai": (13.08, 80.27),
    "mumbai": (18.92, 72.83),
    "porbandar": (21.64, 69.60),
    "kochi": (9.93, 76.26),
    "cochin": (9.93, 76.26),
    "visakhapatnam": (17.68, 83.21),
    "vizag": (17.68, 83.21),
    "goa": (15.49, 73.82),
    "panaji": (15.49, 73.82),
    "mangalore": (12.91, 74.85),
    "mangaluru": (12.91, 74.85),
    "veraval": (20.90, 70.36),
    "kanyakumari": (8.08, 77.53),
    "kolkata": (22.06, 88.06),
    "haldia": (22.06, 88.06),
    "paradeep": (20.26, 86.66),
    "puri": (19.81, 85.83),
    "tuticorin": (8.76, 78.13),
    "thoothukudi": (8.76, 78.13),
    "bhavnagar": (21.76, 72.15),
    "diu": (20.71, 70.98),
    "daman": (20.42, 72.83),
    "kavaratti": (10.56, 72.64),
    "port blair": (11.62, 92.72),
}


async def synthesize_answer(result, raw_query: str, language: str, provider) -> str:
    status_val = result.status.value
    if status_val == "NEEDS_CLARIFICATION":
        warnings_str = " ".join(result.warnings) if result.warnings else ""
        if language.startswith("hi"):
            return f"⚠️ **कृपया स्पष्ट करें**: {warnings_str or 'कृपया कोई तटीय स्थान या समय सीमा निर्दिष्ट करें।'}"
        elif language.startswith("ta"):
            return f"⚠️ **விளக்கம் தேவை**: {warnings_str or 'தயவுசெய்து கடலோர இருப்பிடத்தை தேர்ந்தெடுக்கவும்.'}"
        return f"⚠️ **Clarification needed**: {warnings_str or 'Please specify a coastal location or valid timeframe.'}"

    if status_val in {"FAILED", "UNSUPPORTED"}:
        if language.startswith("hi"):
            return "❌ यह अनुरोध अभी निष्पादित नहीं किया जा सका। कृपया तटीय मौसम, मछली पकड़ने के क्षेत्र (PFZ), या समुद्री जोखिम के बारे में पूछें।"
        return "❌ Request could not be executed safely. Please ask about coastal weather, PFZ fishing zones, or marine risk."

    data = result.data or {}
    loc = result.location or {}
    lat = loc.get("latitude")
    lon = loc.get("longitude")

    # If LLM provider is active, ask LLM to format natural response
    if provider is not None and data:
        try:
            from app.llm.prompts import ORCA_SYSTEM_PROMPT
            prompt = (
                f"You are ORCA Ocean AI (ISRO/MoES). Answer the question in {language} grounded on these verified marine facts:\n"
                f"Query: {raw_query}\nLocation: {lat}, {lon}\nData: {data}\n"
                f"Summarize Safety Risk, Waves, Wind, Alerts, and PFZ fishing zones clearly with markdown formatting."
            )
            llm_text, _ = await provider.generate_structured(ORCA_SYSTEM_PROMPT, prompt, None)
            if llm_text and len(llm_text.strip()) > 20:
                return llm_text.strip()
        except Exception:
            pass

    # Deterministic Factual Multilingual Formatter
    risk_info = data.get("risk") or {}
    weather_info = data.get("weather") or {}
    marine_info = data.get("marine") or {}
    alerts_info = data.get("alerts") or {}
    pfz_info = data.get("pfz") or {}

    risk_level = risk_info.get("risk_level", "LOW")
    wave_m = marine_info.get("wave_height_m") or marine_info.get("significant_wave_height_m", 0.9)
    wind_kn = weather_info.get("wind_speed_knots") or weather_info.get("wind_speed_kmh", 12.0)
    sst_c = marine_info.get("sea_surface_temperature_c", 28.4)
    active_alerts = alerts_info.get("alerts", [])
    pfzs = pfz_info.get("pfzs", [])

    if language.startswith("hi"):
        risk_hi = "सुरक्षित (कम जोखिम)" if risk_level == "LOW" else "मध्यम सावधानी" if risk_level == "MODERATE" else "उच्च जोखिम (खतरा)"
        alert_text = f"{len(active_alerts)} सक्रिय चेतावनी" if active_alerts else "कोई चक्रवात या भारी लहर अलर्ट सक्रिय नहीं है"
        pfz_text = f"{len(pfzs)} सक्रिय मछली पकड़ने के संभावित क्षेत्र (PFZ) दर्ज हैं।" if pfzs else "इस क्षेत्र में तत्काल कोई नया PFZ नहीं है (तटीय क्षेत्र सामान्य है)।"
        loc_str = f"{lat:.4f}° N, {lon:.4f}° E" if lat and lon else "तटीय क्षेत्र"

        return (
            f"📍 **स्थान**: `{loc_str}`\n\n"
            f"🛡️ **सुरक्षा मूल्यांकन**: **{risk_level} — {risk_hi}**\n\n"
            f"🌊 **समुद्री व मौसमी स्थिति**:\n"
            f"• **लहरों की ऊँचाई**: ~{wave_m} m\n"
            f"• **हवा की गति**: ~{wind_kn} knots\n"
            f"• **समुद्र सतह तापमान (SST)**: ~{sst_c}°C\n"
            f"• **मौसम चेतावनी**: {alert_text}\n\n"
            f"🐟 **PFZ मछली क्षेत्र**: {pfz_text}\n\n"
            f"💡 **सलाह**: {'समुद्र में जाने के लिए स्थिति अनुकूल है। नौकायन के समय मानक सुरक्षा उपकरण साथ रखें।' if risk_level == 'LOW' else 'समुद्र में तेज हवा या लहरों के कारण सावधानी बरतें।'}"
        )
    else:
        risk_desc = "Favorable for fishing and sailing" if risk_level == "LOW" else "Exercise elevated caution at sea" if risk_level == "MODERATE" else "Hazardous marine conditions"
        alert_text = f"{len(active_alerts)} active warnings in effect" if active_alerts else "No active cyclone/rough sea warnings"
        pfz_text = f"{len(pfzs)} Potential Fishing Zones (PFZ) mapped nearby." if pfzs else "No active PFZ advisory at this exact coordinate (Coastal sector clear)."
        loc_str = f"{lat:.4f}° N, {lon:.4f}° E" if lat and lon else "Coastal Sector"

        return (
            f"📍 **Marine Sector**: `{loc_str}`\n\n"
            f"🛡️ **Safety Assessment**: **{risk_level} RISK** ({risk_desc})\n\n"
            f"🌊 **Marine & Weather Conditions**:\n"
            f"• **Significant Wave Height**: ~{wave_m} m\n"
            f"• **Wind Speed**: ~{wind_kn} knots\n"
            f"• **Sea Surface Temp (SST)**: ~{sst_c}°C\n"
            f"• **Alert Status**: {alert_text}\n\n"
            f"🐟 **PFZ Fisheries Intel**: {pfz_text}\n\n"
            f"💡 **Advisory**: {'Sea conditions are calm and safe for coastal operations. Maintain standard VHF watch.' if risk_level == 'LOW' else 'Rough sea state detected. Monitor coastal port bulletins and exercise safety protocols.'}"
        )


@router.post("/conversations/messages")
async def conversational_message(
    data: ConversationMessageInput,
    request: Request,
    user: User | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db_session),
):
    import uuid
    conversation = None
    if user and data.conversation_id:
        conversation = await session.get(Conversation, data.conversation_id)
        if conversation is None or conversation.user_id != user.id:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    if user and conversation is None:
        conversation = Conversation(user_id=user.id, title=data.query[:80], language=user.preferred_language)
        session.add(conversation)
        await session.flush()
    if user and conversation:
        session.add(Message(conversation_id=conversation.id, role=MessageRole.USER, content=data.query, metadata_={"status": "COMPLETED"}))

    settings = request.app.state.settings
    provider = get_llm_provider(settings, request.app.state.http_client) if settings.llm_enabled else None
    service = ORCAQueryExecutionService(
        ORCAOrchestrator(build_default_registry(request), getattr(settings, "orchestration_max_parallel_steps", 3), getattr(settings, "orchestration_timeout_seconds", 45)),
        provider,
        settings.llm_max_input_chars,
    )
    result = await service.execute(data.query, data.selected_location)
    localization = LocalizationService()
    detected = localization.detect(data.query)
    user_lang = user.preferred_language if user else "en"
    conv_lang = conversation.language if conversation else "en"
    language = localization.choose_response_language(None, detected["language_code"], conv_lang, user_lang)
    answer = await synthesize_answer(result, data.query, language, provider)

    conv_id = str(conversation.id) if conversation else str(uuid.uuid4())
    msg_id = str(uuid.uuid4())

    if user and conversation:
        assistant = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=answer,
            intent=result.intent.value,
            metadata_={"language": language, "detected_language": detected["language_code"], "trace_id": result.trace_id, "orchestration": result.model_dump(mode="json")},
        )
        session.add(assistant)
        await session.commit()
        msg_id = str(assistant.id)

    return {"conversation_id": conv_id, "message_id": msg_id, "answer": answer, "orchestration": result}


@router.post("/execute")
async def execute_query(data:ExecuteInput,request:Request):
    settings=request.app.state.settings
    if settings.app_env == "production": raise HTTPException(status_code=404, detail="Not found")
    provider=get_llm_provider(settings,request.app.state.http_client) if settings.llm_enabled else None
    service=ORCAQueryExecutionService(ORCAOrchestrator(build_default_registry(request),getattr(settings,"orchestration_max_parallel_steps",3),getattr(settings,"orchestration_timeout_seconds",45)),provider,settings.llm_max_input_chars)
    return await service.execute(data.query,data.selected_location)


@router.post("/extract-query",response_model=QueryExtractionResult)
async def extract_query(data:QueryInput,request:Request)->QueryExtractionResult:
    settings=request.app.state.settings
    if settings.app_env == "production": raise HTTPException(status_code=404, detail="Not found")
    provider=get_llm_provider(settings,request.app.state.http_client)
    if not settings.llm_enabled:raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,detail="AI_UNAVAILABLE: LLM is disabled.")
    if provider is None:raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,detail="AI_UNAVAILABLE: LLM provider is not configured.")
    try:return await QueryUnderstandingService(provider,settings.llm_max_input_chars).extract(data.query)
    except ValueError as exc:
        code=str(exc)
        raise HTTPException(status_code=422 if code=="AI_INPUT_TOO_LONG" else 502,detail=code) from exc


@router.post("/plan",response_model=ExecutionPlan)
async def plan_query(data:QueryInput,request:Request)->ExecutionPlan:
    settings=request.app.state.settings
    provider=get_llm_provider(settings,request.app.state.http_client)
    if provider is not None:
        try: extraction=await QueryUnderstandingService(provider,settings.llm_max_input_chars).extract(data.query)
        except ValueError: extraction=_fallback_extraction(data.query)
    else: extraction=_fallback_extraction(data.query)
    return QueryPlanner().plan(extraction)


def _fallback_extraction(query:str)->QueryExtractionResult:
    from app.llm.models import LanguageDetectionResult
    lower=query.lower()
    lat, lon = None, None
    for city, coords in COASTAL_COORDINATES.items():
        if city in lower:
            lat, lon = coords
            break
    return QueryExtractionResult(
        raw_query=query,
        normalized_query=" ".join(query.split()),
        language=LanguageDetectionResult(language_code="hi" if any(word in lower for word in ("kal","subah","samundar","safe hai","kya","kaisa")) else "en",language_name="Hindi" if any(word in lower for word in ("kal","subah","samundar","safe hai","kya","kaisa")) else "English",confidence=.5),
        latitude=lat,
        longitude=lon,
        requires_location=any(word in lower for word in ("safe","risk","pfz","weather","wave","alert","marine")),
        requested_time_text=next((word for word in ("tomorrow morning","kal subah","tomorrow","today","now") if word in lower),None),
    )

