"""Controlled Step 11 query-understanding endpoint; it executes no marine tools."""
from fastapi import APIRouter,HTTPException,Request,status,Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.llm.factory import get_llm_provider
from app.llm.models import QueryExtractionResult
from app.schemas.ai import QueryInput,ExecuteInput,ConversationMessageInput
from app.api.dependencies import get_current_user
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

@router.post("/conversations/messages")
async def conversational_message(data:ConversationMessageInput,request:Request,user:User=Depends(get_current_user),session:AsyncSession=Depends(get_db_session)):
    conversation=None
    if data.conversation_id:
        conversation=await session.get(Conversation,UUID(data.conversation_id))
        if conversation is None or conversation.user_id != user.id: raise HTTPException(status_code=404,detail="Conversation not found.")
    if conversation is None:
        conversation=Conversation(user_id=user.id,title=data.query[:80],language=user.preferred_language)
        session.add(conversation); await session.flush()
    session.add(Message(conversation_id=conversation.id,role=MessageRole.USER,content=data.query,metadata_={"status":"COMPLETED"}))
    settings=request.app.state.settings;provider=get_llm_provider(settings,request.app.state.http_client) if settings.llm_enabled else None
    service=ORCAQueryExecutionService(ORCAOrchestrator(build_default_registry(request),getattr(settings,"orchestration_max_parallel_steps",3),getattr(settings,"orchestration_timeout_seconds",45)),provider,settings.llm_max_input_chars)
    result=await service.execute(data.query,data.selected_location)
    localization=LocalizationService();detected=localization.detect(data.query);language=localization.choose_response_language(None,detected["language_code"],conversation.language,user.preferred_language)
    answer="I could not execute that request." if result.status.value in {"FAILED","UNSUPPORTED"} else (localization.label("unavailable",language) if result.status.value=="NEEDS_CLARIFICATION" else f"ORCA completed the request with status {result.status.value}.")
    assistant=Message(conversation_id=conversation.id,role=MessageRole.ASSISTANT,content=answer,intent=result.intent.value,metadata_={"language":language,"detected_language":detected["language_code"],"trace_id":result.trace_id,"orchestration":result.model_dump(mode="json")})
    session.add(assistant);await session.commit()
    return {"conversation_id":str(conversation.id),"message_id":str(assistant.id),"answer":answer,"orchestration":result}

@router.post("/execute")
async def execute_query(data:ExecuteInput,request:Request):
    settings=request.app.state.settings
    provider=get_llm_provider(settings,request.app.state.http_client) if settings.llm_enabled else None
    service=ORCAQueryExecutionService(ORCAOrchestrator(build_default_registry(request),getattr(settings,"orchestration_max_parallel_steps",3),getattr(settings,"orchestration_timeout_seconds",45)),provider,settings.llm_max_input_chars)
    return await service.execute(data.query,data.selected_location)


@router.post("/extract-query",response_model=QueryExtractionResult)
async def extract_query(data:QueryInput,request:Request)->QueryExtractionResult:
    settings=request.app.state.settings
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
    return QueryExtractionResult(raw_query=query,normalized_query=" ".join(query.split()),language=LanguageDetectionResult(language_code="hi" if any(word in lower for word in ("kal","subah","samundar","safe hai")) else "en",language_name="Hindi" if any(word in lower for word in ("kal","subah","samundar","safe hai")) else "English",confidence=.5),requires_location=any(word in lower for word in ("safe","risk","pfz","weather","wave","alert","marine")),requested_time_text=next((word for word in ("tomorrow morning","kal subah","tomorrow","today","now") if word in lower),None))
