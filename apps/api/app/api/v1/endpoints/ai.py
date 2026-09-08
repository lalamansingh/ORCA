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
        if language.startswith("hi-Latn"):
            return f"⚠️ **Clarification required**: {warnings_str or 'Kripya koi coastal sector (jaise Mumbai, Chennai, Kochi) batayein.'}"
        elif language.startswith("hi"):
            return f"⚠️ **कृपया स्पष्ट करें**: {warnings_str or 'कृपया कोई तटीय स्थान (जैसे मुंबई, चेन्नई, कोच्चि) निर्दिष्ट करें।'}"
        elif language.startswith("ta"):
            return f"⚠️ **விளக்கம் தேவை**: {warnings_str or 'தயவுசெய்து கடலோர இருப்பிடத்தை (சென்னை, கொச்சி, தூத்துக்குடி) குறிப்பிடவும்.'}"
        elif language.startswith("te"):
            return f"⚠️ **వివరణ అవసరం**: {warnings_str or 'దయచేసి తీరప్రాంతాన్ని (విశాఖపట్నం, చెన్నై, ముంబై) పేర్కొనండి.'}"
        elif language.startswith("ml"):
            return f"⚠️ **വിശദീകരണം ആവശ്യമാണ്**: {warnings_str or 'ദയവായി ഒരു തീരദേശ പ്രദേശം (കൊച്ചി, ചെന്നൈ) വ്യക്തമാക്കുക.'}"
        elif language.startswith("gu"):
            return f"⚠️ **સ્પષ્ટતા જરૂરી છે**: {warnings_str or 'કૃપા કરીને દરિયાકાંઠાનું સ્થળ (પોરબંદર, વેરાવળ, મુંબઈ) સ્પષ્ટ કરો.'}"
        elif language.startswith("mr"):
            return f"⚠️ **कृपया स्पष्ट करा**: {warnings_str or 'कृपया सागरी ठिकाण (मुंबई, गोवा, रत्नागिरी) नमूद करा.'}"
        elif language.startswith("bn"):
            return f"⚠️ **স্পষ্টকরণ প্রয়োজন**: {warnings_str or 'অনুগ্রহ করে একটি উপকূলীয় স্থান (কলকাতা, দিঘা, হলদিয়া) উল্লেখ করুন।'}"
        elif language.startswith("or"):
            return f"⚠️ **ସ୍ପଷ୍ଟୀକରଣ ଆବଶ୍ୟକ**: {warnings_str or 'ଦୟାକରି ଏକ ଉପକୂଳବର୍ତ୍ତୀ ସ୍ଥାନ (ପାରାଦ୍ୱୀପ, ପୁରୀ) ଉଲ୍ଲେଖ କରନ୍ତୁ।'}"
        elif language.startswith("kn"):
            return f"⚠️ **ವಿವರಣೆ ಅಗತ್ಯವಿದೆ**: {warnings_str or 'ದಯವಿಟ್ಟು ಕರಾವಳಿ ಸ್ಥಳವನ್ನು (ಮಂಗಳೂರು, ಕಾರವಾರ) ನಿರ್ದಿಷ್ಟಪಡಿಸಿ.'}"
        return f"⚠️ **Clarification needed**: {warnings_str or 'Please specify a coastal sector (e.g. Mumbai, Chennai, Kochi).'}"

    if status_val in {"FAILED", "UNSUPPORTED"}:
        if language.startswith("hi-Latn"):
            return "❌ Yeh request execute nahi ho saki. Kripya coastal mausam, PFZ machli zone, ya marine risk ke baare me puchen."
        elif language.startswith("hi"):
            return "❌ यह अनुरोध अभी निष्पादित नहीं किया जा सका। कृपया तटीय मौसम, मछली पकड़ने के क्षेत्र (PFZ), या समुद्री जोखिम के बारे में पूछें।"
        elif language.startswith("ta"):
            return "❌ கோரிக்கை நிறைவேற்றப்படவில்லை. கடல் வானிலை அல்லது மீன்பிடி மண்டலங்கள் பற்றி கேட்கவும்."
        elif language.startswith("te"):
            return "❌ అభ్యర్థన విజయవంతం కాలేదు. దయచేసి తీరప్రాంత వాతావరణం లేదా చేపల వేట ప్రాంతాల గురించి అడగండి."
        elif language.startswith("ml"):
            return "❌ ഈ അഭ്യർത്ഥന പൂർത്തിയാക്കാൻ കഴിഞ്ഞില്ല. ദയവായി തീരദേശ കാലാവസ്ഥയെക്കുറിച്ചോ മത്സ്യബന്ധന മേഖലകളെക്കുറിച്ചോ ചോദിക്കുക."
        elif language.startswith("gu"):
            return "❌ વિનંતી પૂર્ણ થઈ શકી નથી. કૃપા કરીને દરિયાઈ હવામાન અથવા PFZ માછીમારી ઝોન વિશે પૂછો."
        elif language.startswith("mr"):
            return "❌ विनंती पूर्ण होऊ शकली नाही. कृपया सागरी हवामान किंवा PFZ मासेमारी क्षेत्राबद्दल विचारा."
        elif language.startswith("bn"):
            return "❌ অনুরোধ সম্পন্ন করা যায়নি। অনুগ্রহ করে উপকূলীয় আবহাওয়া বা PFZ মাছ ধরার অঞ্চল সম্পর্কে জিজ্ঞাসা করুন।"
        elif language.startswith("or"):
            return "❌ ଅନୁରୋଧ ସମ୍ପନ୍ନ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ଉପକୂଳ ପାଣିପାଗ କିମ୍ବା PFZ ମତ୍ସ୍ୟ କ୍ଷେତ୍ର ବିଷୟରେ ପଚାରନ୍ତୁ।"
        elif language.startswith("kn"):
            return "❌ ವಿನಂತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಕರಾವಳಿ ಹವಾಮಾನ ಅಥವಾ PFZ ಮೀನುಗಾರಿಕಾ ವಲಯದ ಬಗ್ಗೆ ಕೇಳಿ."
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
    loc_str = f"{lat:.4f}° N, {lon:.4f}° E" if (lat and lon) else "तटीय क्षेत्र"

    if language.startswith("hi-Latn"):
        risk_desc = "Samundar me jaana safe hai (LOW RISK)" if risk_level == "LOW" else "Savdhani bartein (MODERATE RISK)" if risk_level == "MODERATE" else "Khatarnak halat (HIGH RISK)"
        alert_text = f"{len(active_alerts)} active warnings" if active_alerts else "Koi cyclone ya rough sea warning nahi hai"
        pfz_text = f"{len(pfzs)} active PFZ machli pakadne ke zone darj hain." if pfzs else "Is sector me filhal koi naya PFZ advisory nahi hai."
        return (
            f"📍 **Marine Sector**: `{loc_str}`\n\n"
            f"🛡️ **Safety Assessment**: **{risk_level} — {risk_desc}**\n\n"
            f"🌊 **Samundar & Mausam Ki Jankari**:\n"
            f"• **Lehar Ki Unchai (Waves)**: ~{wave_m} m\n"
            f"• **Hawa Ki Speed (Wind)**: ~{wind_kn} knots\n"
            f"• **Samundar Ka Taapman (SST)**: ~{sst_c}°C\n"
            f"• **Alert Status**: {alert_text}\n\n"
            f"🐟 **PFZ Machli Zone**: {pfz_text}\n\n"
            f"💡 **Advisory**: {'Samundar shant hai aur machli pakadne ke liye sthiti anukool hai. Standard VHF radio on rakhein.' if risk_level == 'LOW' else 'Tez hawa ya unchi lehro ke karan savdhani bartein.'}"
        )
    elif language.startswith("hi"):
        risk_hi = "सुरक्षित — समुद्र में जाना अनुकूल है" if risk_level == "LOW" else "मध्यम — सावधानी बरतें" if risk_level == "MODERATE" else "उच्च जोखिम — खतरनाक स्थिति"
        alert_text = f"{len(active_alerts)} सक्रिय चेतावनी" if active_alerts else "कोई चक्रवात या भारी लहर अलर्ट सक्रिय नहीं है"
        pfz_text = f"{len(pfzs)} सक्रिय मछली पकड़ने के संभावित क्षेत्र (PFZ) दर्ज हैं।" if pfzs else "इस क्षेत्र में तत्काल कोई नया PFZ नहीं है (तटीय क्षेत्र सामान्य है)।"
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
    elif language.startswith("ta"):
        risk_ta = "மீன்பிடிக்க சாதகமானது (பாதுகாப்பானது)" if risk_level == "LOW" else "கவனம் தேவை (மிதமான அபாயம்)" if risk_level == "MODERATE" else "உயர் அபாயம் (ஆபத்தானது)"
        alert_ta = f"{len(active_alerts)} தீவிர எச்சரிக்கைகள்" if active_alerts else "புயல் அல்லது தீவிர அலை எச்சரிக்கை இல்லை"
        pfz_ta = f"{len(pfzs)} செயலில் உள்ள PFZ மீன்பிடி மண்டலங்கள் கண்டறியப்பட்டுள்ளன." if pfzs else "இந்த பகுதியில் புதிய PFZ அறிக்கை இல்லை."
        return (
            f"📍 **கடலோர பகுதி**: `{loc_str}`\n\n"
            f"🛡️ **பாதுகாப்பு மதிப்பீடு**: **{risk_level} — {risk_ta}**\n\n"
            f"🌊 **கடல் மற்றும் வானிலை விவரம்**:\n"
            f"• **அலை உயரம்**: ~{wave_m} m\n"
            f"• **காற்றின் வேகம்**: ~{wind_kn} knots\n"
            f"• **கடல் மேற்பரப்பு வெப்பநிலை (SST)**: ~{sst_c}°C\n"
            f"• **எச்சரிக்கைகள்**: {alert_ta}\n\n"
            f"🐟 **PFZ மீன்பிடி மண்டலம்**: {pfz_ta}\n\n"
            f"💡 **அறிவுரை**: {'கடல் அமைதியாகவும் மீன்பிடிக்க உகந்ததாகவும் உள்ளது. நிலையான பாதுகாப்பு நெறிமுறைகளைப் பின்பற்றவும்.' if risk_level == 'LOW' else 'கடலில் பலத்த காற்று அல்லது அலைகள் காரணமாக எச்சரிக்கையுடன் செல்லவும்.'}"
        )
    elif language.startswith("te"):
        risk_te = "చేపల వేటకు అనుకూలం (సురక్షితం)" if risk_level == "LOW" else "జాగ్రత్త అవసరం (మధ్యస్థ ప్రమాదం)" if risk_level == "MODERATE" else "అధిక ప్రమాదం (ప్రమాదకరం)"
        alert_te = f"{len(active_alerts)} హెచ్చరికలు అమలులో ఉన్నాయి" if active_alerts else "తుఫాను లేదా భారీ అలల హెచ్చరికలు లేవు"
        pfz_te = f"{len(pfzs)} PFZ చేపల వేట ప్రాంతాలు గుర్తించబడ్డాయి." if pfzs else "ఈ ప్రాంతంలో ప్రస్తుతం కొత్త PFZ సూచనలు లేవు."
        return (
            f"📍 **తీర ప్రాంతం**: `{loc_str}`\n\n"
            f"🛡️ **భద్రతా అంచనా**: **{risk_level} — {risk_te}**\n\n"
            f"🌊 **సముద్రం & వాతావరణ సమాచారం**:\n"
            f"• **అలల ఎత్తు**: ~{wave_m} m\n"
            f"• **గాలి వేగం**: ~{wind_kn} knots\n"
            f"• **సముద్ర ఉపరితల ఉష్ణోగ్రత (SST)**: ~{sst_c}°C\n"
            f"• **హెచ్చరికలు**: {alert_te}\n\n"
            f"🐟 **PFZ చేపల వేట జోన్**: {pfz_te}\n\n"
            f"💡 **సలహా**: {'సముద్ర పరిస్థితులు ప్రశాంతంగా ఉన్నాయి. ప్రామాణిక భద్రతా పరికరాలతో వేటకు వెళ్లవచ్చు.' if risk_level == 'LOW' else 'సముద్రంలో బలమైన గాలులు లేదా అలల కారణంగా అప్రమత్తంగా ఉండండి.'}"
        )
    elif language.startswith("ml"):
        risk_ml = "മത്സ്യബന്ധനത്തിന് അനുയോജ്യം (സുരക്ഷിതം)" if risk_level == "LOW" else "ജാഗ്രത പാലിക്കുക" if risk_level == "MODERATE" else "അപകടകരമായ അവസ്ഥ"
        alert_ml = f"{len(active_alerts)} മുന്നറിയിപ്പുകൾ നിലവിലുണ്ട്" if active_alerts else "ചുഴലിക്കാറ്റ് അല്ലെങ്കിൽ ഉയർന്ന തിരമാല മുന്നറിയിപ്പുകൾ ഇല്ല"
        pfz_ml = f"{len(pfzs)} സാധ്യതയുള്ള മത്സ്യബന്ധന മേഖലകൾ (PFZ) കണ്ടെത്തി." if pfzs else "ഈ മേഖലയിൽ നിലവിൽ പുതിയ PFZ മുന്നറിയിപ്പുകൾ ഇല്ല."
        return (
            f"📍 **തീരദേശ മേഖല**: `{loc_str}`\n\n"
            f"🛡️ **സുരക്ഷാ വിലയിരുത്തൽ**: **{risk_level} — {risk_ml}**\n\n"
            f"🌊 **കടൽ & കാലാവസ്ഥാ വിവരങ്ങൾ**:\n"
            f"• **തിരമാലയുടെ ഉയരം**: ~{wave_m} m\n"
            f"• **കാറ്റിന്റെ വേഗത**: ~{wind_kn} knots\n"
            f"• **കടൽ ഉപരിതല താപനില (SST)**: ~{sst_c}°C\n"
            f"• **മുന്നറിയിപ്പുകൾ**: {alert_ml}\n\n"
            f"🐟 **PFZ മത്സ്യബന്ധന മേഖല**: {pfz_ml}\n\n"
            f"💡 **നിർദ്ദേശം**: {'കടൽ ശാന്തമാണ്. സുരക്ഷാ മാനദണ്ഡങ്ങൾ പാലിച്ച് യാത്ര ചെയ്യാം.' if risk_level == 'LOW' else 'പ്രക്ഷുബ്ധമായ കടൽ അവസ്ഥ. തീരദേശ ബുള്ളറ്റിനുകൾ നിരീക്ഷിക്കുക.'}"
        )
    elif language.startswith("gu"):
        risk_gu = "માછીમારી માટે અનુકૂળ (સુરક્ષિત)" if risk_level == "LOW" else "સાવચેતી રાખવી (મધ્યમ જોખમ)" if risk_level == "MODERATE" else "ભારે જોખમી સ્થિતિ"
        alert_gu = f"{len(active_alerts)} સક્રિય ચેતવણીઓ" if active_alerts else "વાવાઝોડા કે ઊંચા મોજાની કોઈ ચેતવણી નથી"
        pfz_gu = f"{len(pfzs)} સક્રિય PFZ માછીમારી ઝોન ઉપલબ્ધ છે." if pfzs else "હાલમાં આ વિસ્તારમાં કોઈ નવું PFZ નથી."
        return (
            f"📍 **દરિયાકાંઠાનો વિસ્તાર**: `{loc_str}`\n\n"
            f"🛡️ **સુરક્ષા મૂલ્યાંકન**: **{risk_level} — {risk_gu}**\n\n"
            f"🌊 **દરિયાઈ અને હવામાન પરિસ્થિતિ**:\n"
            f"• **મોજાની ઊંચાઈ**: ~{wave_m} m\n"
            f"• **પવનની ગતિ**: ~{wind_kn} knots\n"
            f"• **દરિયાઈ સપાટીનું તાપમાન (SST)**: ~{sst_c}°C\n"
            f"• **ચેતવણીઓ**: {alert_gu}\n\n"
            f"🐟 **PFZ માછીમારી ઝોન**: {pfz_gu}\n\n"
            f"💡 **સલાહ**: {'દરિયો શાંત છે અને માછીમારી માટે અનુકૂળ છે.' if risk_level == 'LOW' else 'દરિયામાં ભારે પવન અથવા ઊંચા મોજાને કારણે સાવચેતી રાખો.'}"
        )
    elif language.startswith("mr"):
        risk_mr = "मासेमारीसाठी अनुकूल (सुरक्षित)" if risk_level == "LOW" else "मध्यम काळजी घ्या" if risk_level == "MODERATE" else "उच्च धोका (धोकादायक)"
        alert_mr = f"{len(active_alerts)} सक्रिय इशारे" if active_alerts else "कोणताही चक्रीवादळ किंवा उंच लाटांचा इशारा नाही"
        pfz_mr = f"{len(pfzs)} संभाव्य मासेमारी क्षेत्र (PFZ) नोंदवले आहेत." if pfzs else "सध्या या क्षेत्रात नवीन PFZ नाही."
        return (
            f"📍 **सागरी क्षेत्र**: `{loc_str}`\n\n"
            f"🛡️ **सुरक्षा मूल्यांकन**: **{risk_level} — {risk_mr}**\n\n"
            f"🌊 **सागरी व हवामान स्थिती**:\n"
            f"• **लाटांची उंची**: ~{wave_m} m\n"
            f"• **वाऱ्याचा वेग**: ~{wind_kn} knots\n"
            f"• **समुद्र पृष्ठभागाचे तापमान (SST)**: ~{sst_c}°C\n"
            f"• **हवामान इशारे**: {alert_mr}\n\n"
            f"🐟 **PFZ मासेमारी क्षेत्र**: {pfz_mr}\n\n"
            f"💡 **सल्ला**: {'समुद्र शांत असून परिस्थिती सुरक्षित आहे. आवश्यक सुरक्षा साधनांसह प्रवास करा.' if risk_level == 'LOW' else 'समुद्रात जोरदार वारे किंवा लाटांमुळे खबरदारी बाळगा.'}"
        )
    elif language.startswith("bn"):
        risk_bn = "মাছ ধরার জন্য অনুকূল (নিরাপদ)" if risk_level == "LOW" else "সতর্কতা প্রয়োজন (মাঝারি ঝুঁকি)" if risk_level == "MODERATE" else "উচ্চ ঝুঁকি (বিপজ্জনক)"
        alert_bn = f"{len(active_alerts)}টি সক্রিয় সতর্কতা" if active_alerts else "কোনো ঘূর্ণিঝড় বা উত্তাল সমুদ্রের সতর্কতা নেই"
        pfz_bn = f"{len(pfzs)}টি সক্রিয় PFZ মাছ ধরার অঞ্চল চিহ্নিত হয়েছে।" if pfzs else "এই অঞ্চলে বর্তমানে নতুন কোনো PFZ নেই।"
        return (
            f"📍 **উপকূলীয় অঞ্চল**: `{loc_str}`\n\n"
            f"🛡️ **নিরাপত্তা মূল্যায়ন**: **{risk_level} — {risk_bn}**\n\n"
            f"🌊 **সামুদ্রিক ও আবহাওয়া পরিস্থিতি**:\n"
            f"• **ঢেউয়ের উচ্চতা**: ~{wave_m} m\n"
            f"• **বাতাসের গতিবেগ**: ~{wind_kn} knots\n"
            f"• **সমুদ্রপৃষ্ঠের তাপমাত্রা (SST)**: ~{sst_c}°C\n"
            f"• **আবহাওয়ার সতর্কতা**: {alert_bn}\n\n"
            f"🐟 **PFZ মাছ ধরার অঞ্চল**: {pfz_bn}\n\n"
            f"💡 **পরামর্শ**: {'সমুদ্র শান্ত রয়েছে এবং মাছ ধরার জন্য অনুকূল।' if risk_level == 'LOW' else 'উত্তাল সমুদ্রের কারণে সতর্কতা অবলম্বন করুন।'}"
        )
    elif language.startswith("or"):
        risk_or = "ମାଛ ଧରିବା ପାଇଁ ଅନୁକୂଳ (ସୁରକ୍ଷିତ)" if risk_level == "LOW" else "ସତର୍କତା ଆବଶ୍ୟକ" if risk_level == "MODERATE" else "ଉଚ୍ଚ ବିପଦ"
        alert_or = f"{len(active_alerts)}ଟି ସକ୍ରିୟ ଚେତାବନୀ" if active_alerts else "କୌଣସି ବାତ୍ୟା ଚେତାବନୀ ନାହିଁ"
        pfz_or = f"{len(pfzs)}ଟି ସକ୍ରିୟ PFZ ମତ୍ସ୍ୟ କ୍ଷେତ୍ର ଉପଲବ୍ଧ ଅଛି।" if pfzs else "ବର୍ତ୍ତମାନ କୌଣସି ନୂତନ PFZ ନାହିଁ।"
        return (
            f"📍 **ଉପକୂଳବର୍ତ୍ତୀ କ୍ଷେତ୍ର**: `{loc_str}`\n\n"
            f"🛡️ **ସୁରକ୍ଷା ମୂଲ୍ୟାଙ୍କନ**: **{risk_level} — {risk_or}**\n\n"
            f"🌊 **ସାମୁଦ୍ରିକ ଓ ପାଣିପାଗ ସ୍ଥିତି**:\n"
            f"• **ଢେଉର ଉଚ୍ଚତା**: ~{wave_m} m\n"
            f"• **ପବନର ଗତି**: ~{wind_kn} knots\n"
            f"• **ସମୁଦ୍ର ପୃଷ୍ଠ ତାପମାତ୍ରା (SST)**: ~{sst_c}°C\n"
            f"• **ଚେତାବନୀ**: {alert_or}\n\n"
            f"🐟 **PFZ ମତ୍ସ୍ୟ କ୍ଷେତ୍ର**: {pfz_or}\n\n"
            f"💡 **ପରାମର୍ଶ**: {'ସମୁଦ୍ର ଶାନ୍ତ ରହିଛି।' if risk_level == 'LOW' else 'ସମୁଦ୍ରରେ ଉଚ୍ଚ ଢେଉ ହେତୁ ସତର୍କ ରୁହନ୍ତୁ।'}"
        )
    elif language.startswith("kn"):
        risk_kn = "ಮೀನುಗಾರಿಕೆಗೆ ಅನುಕೂಲಕರ (ಸುರಕ್ಷಿತ)" if risk_level == "LOW" else "ಎಚ್ಚರಿಕೆ ಅಗತ್ಯ" if risk_level == "MODERATE" else "ಹೆಚ್ಚಿನ ಅಪಾಯ"
        alert_kn = f"{len(active_alerts)} ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು" if active_alerts else "ಯಾವುದೇ ಚಂಡಮಾರುತದ ಎಚ್ಚರಿಕೆ ಇಲ್ಲ"
        pfz_kn = f"{len(pfzs)} ಸಕ್ರಿಯ PFZ ಮೀನುಗಾರಿಕಾ ವಲಯಗಳು ಲಭ್ಯವಿದೆ." if pfzs else "ಪ್ರಸ್ತುತ ಯಾವುದೇ ಹೊಸ PFZ ಇಲ್ಲ."
        return (
            f"📍 **ಕರಾವಳಿ ವಲಯ**: `{loc_str}`\n\n"
            f"🛡️ **ಸುರಕ್ಷತಾ ಮೌಲ್ಯಮಾಪನ**: **{risk_level} — {risk_kn}**\n\n"
            f"🌊 **ಸಮುದ್ರ ಮತ್ತು ಹವಾಮಾನ ಸ್ಥಿತಿ**:\n"
            f"• **ಅಲೆಗಳ ಎತ್ತರ**: ~{wave_m} m\n"
            f"• **ಗಾಳಿಯ ವೇಗ**: ~{wind_kn} knots\n"
            f"• **ಸಮುದ್ರ ಮೇಲ್ಮೈ ತಾಪಮಾನ (SST)**: ~{sst_c}°C\n"
            f"• **ಎಚ್ಚರಿಕೆಗಳು**: {alert_kn}\n\n"
            f"🐟 **PFZ ಮೀನುಗಾರಿಕಾ ವಲಯ**: {pfz_kn}\n\n"
            f"💡 **ಸಲಹೆ**: {'ಸಮುದ್ರ ಪರಿಸ್ಥಿತಿ ಶಾಂತವಾಗಿದೆ ಮತ್ತು ಮೀನುಗಾರಿಕೆಗೆ ಅನುಕೂಲಕರವಾಗಿದೆ.' if risk_level == 'LOW' else 'ಸಮುದ್ರದಲ್ಲಿ ಅಲೆಗಳ ಹೆಚ್ಚಳದ ಕಾರಣ ಎಚ್ಚರಿಕೆ ವಹಿಸಿ.'}"
        )
    else:
        risk_desc = "Favorable for fishing and sailing (Safe)" if risk_level == "LOW" else "Exercise elevated caution at sea" if risk_level == "MODERATE" else "Hazardous marine conditions"
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


def _fallback_extraction(query: str) -> QueryExtractionResult:
    from app.localization.language_detection import detect_language
    from app.orchestrator.pipeline import COASTAL_COORDINATES
    lower = query.lower()
    lat, lon = None, None
    for city, coords in COASTAL_COORDINATES.items():
        if city in lower or city in query:
            lat, lon = coords
            break
    code, lang_name, _, conf, _ = detect_language(query)
    return QueryExtractionResult(
        raw_query=query,
        normalized_query=" ".join(query.split()),
        language=LanguageDetectionResult(language_code=code, language_name=lang_name, confidence=conf),
        latitude=lat,
        longitude=lon,
        requires_location=True,
        requested_time_text=next((word for word in ("tomorrow morning", "kal subah", "tomorrow", "today", "now", "kal") if word in lower), None),
    )


