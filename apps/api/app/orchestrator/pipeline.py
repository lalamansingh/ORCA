from app.llm.models import LanguageDetectionResult, QueryExtractionResult
from app.services.query_understanding_service import QueryUnderstandingService
from app.planner.planner import QueryPlanner
from app.orchestrator.models import OrchestrationResult
from app.orchestrator.service import ORCAOrchestrator
from app.localization.language_detection import detect_language

COASTAL_COORDINATES: dict[str, tuple[float, float]] = {
    "mumbai": (18.92, 72.83), "bombay": (18.92, 72.83), "मुंबई": (18.92, 72.83), "மும்பை": (18.92, 72.83), "ముంబై": (18.92, 72.83),
    "chennai": (13.08, 80.27), "madras": (13.08, 80.27), "चेन्नई": (13.08, 80.27), "சென்னை": (13.08, 80.27), "చెన్నై": (13.08, 80.27),
    "kochi": (9.93, 76.26), "cochin": (9.93, 76.26), "कोच्चि": (9.93, 76.26), "கொச்சி": (9.93, 76.26), "കൊച്ചി": (9.93, 76.26),
    "porbandar": (21.64, 69.60), "पोरबंदर": (21.64, 69.60), "પોરબંદર": (21.64, 69.60),
    "goa": (15.49, 73.82), "panaji": (15.49, 73.82), "गोवा": (15.49, 73.82), "கோவா": (15.49, 73.82),
    "visakhapatnam": (17.68, 83.21), "vizag": (17.68, 83.21), "विशाखापट्टनम": (17.68, 83.21), "విశాఖపట్నం": (17.68, 83.21),
    "veraval": (20.90, 70.36), "वेरावल": (20.90, 70.36), "વેરાવળ": (20.90, 70.36),
    "mangalore": (12.91, 74.85), "mangaluru": (12.91, 74.85), "मंगलुरु": (12.91, 74.85), "மங்களூர்": (12.91, 74.85), "ಮಂಗಳೂರು": (12.91, 74.85),
    "kanyakumari": (8.08, 77.53), "कन्याकुमारी": (8.08, 77.53), "கன்னியாகுமரி": (8.08, 77.53),
    "tuticorin": (8.76, 78.13), "thoothukudi": (8.76, 78.13), "தூத்துக்குடி": (8.76, 78.13),
    "puri": (19.81, 85.83), "पुरी": (19.81, 85.83), "ପୁରୀ": (19.81, 85.83),
    "paradeep": (20.26, 86.66), "पारादीप": (20.26, 86.66), "ପାରାଦୀପ": (20.26, 86.66),
    "kolkata": (22.06, 88.06), "haldia": (22.06, 88.06), "कोलकाता": (22.06, 88.06), "কলকাতা": (22.06, 88.06),
    "digha": (21.62, 87.50), "दीघा": (21.62, 87.50), "দিঘা": (21.62, 87.50),
    "bhavnagar": (21.76, 72.15), "भावनगर": (21.76, 72.15), "ભાવનગર": (21.76, 72.15),
    "diu": (20.71, 70.98), "daman": (20.42, 72.83),
    "kavaratti": (10.56, 72.64), "lakshadweep": (10.56, 72.64),
    "port blair": (11.62, 92.72), "andaman": (11.62, 92.72),
}


class ORCAQueryExecutionService:
    def __init__(self, orchestrator: ORCAOrchestrator, provider=None, max_input_chars: int = 4000):
        self.orchestrator = orchestrator
        self.provider = provider
        self.max_input_chars = max_input_chars

    async def execute(self, query: str, selected_location: dict | None = None) -> OrchestrationResult:
        if self.provider:
            try:
                extraction = await QueryUnderstandingService(self.provider, self.max_input_chars).extract(query)
            except Exception:
                extraction = self._fallback(query, selected_location)
        else:
            extraction = self._fallback(query, selected_location)

        plan = QueryPlanner().plan(extraction, selected_location)
        return await self.orchestrator.execute(plan, query, selected_location)

    @staticmethod
    def _fallback(query: str, selected_location: dict | None = None) -> QueryExtractionResult:
        lower = query.lower()
        lat, lon = None, None
        for name, coords in COASTAL_COORDINATES.items():
            if name in lower or name in query:
                lat, lon = coords
                break

        if lat is None and selected_location and "latitude" in selected_location and "longitude" in selected_location:
            lat = float(selected_location["latitude"])
            lon = float(selected_location["longitude"])

        code, lang_name, _, conf, _ = detect_language(query)

        return QueryExtractionResult(
            raw_query=query,
            normalized_query=" ".join(query.split()),
            language=LanguageDetectionResult(language_code=code, language_name=lang_name, confidence=conf),
            latitude=lat,
            longitude=lon,
            requires_location=True,
            requested_time_text=next((term for term in ("tomorrow morning", "kal subah", "tomorrow", "today", "now", "kal") if term in lower), None),
        )

