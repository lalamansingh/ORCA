import re
from app.llm.models import QueryExtractionResult
from app.planner.models import IntentClassification,IntentSignals,PlannerIntent


def classify(extraction: QueryExtractionResult) -> IntentClassification:
    text=f"{extraction.raw_query} {extraction.normalized_query}".lower()
    signals=IntentSignals(mentions_safe=bool(re.search(r"\b(safe|risk|danger|sail|depart|venture|surakshit|jana)\b",text)),mentions_pfz=bool(re.search(r"\b(pfz|fishing zone|potential fishing zone|machhli)\b",text)),mentions_weather=bool(re.search(r"\b(weather|rain|mausam|wind|visibility)\b",text)),mentions_waves=bool(re.search(r"\b(wave|waves|swell|current|lehar|samundar|sea condition)\b",text)),mentions_alert=bool(re.search(r"\b(alert|warning|cyclone|high wave)\b",text)),mentions_chlorophyll=bool(re.search(r"\b(chlorophyll|sst|productivity)\b",text)),mentions_geofence=bool(re.search(r"\b(international waters?|maritime boundary|restricted waters?|protected areas?|geofence|fishing restriction|allowed|prohibited|boundary kitni)\b",text)),mentions_map=bool(re.search(r"\b(map|map pe|on map|display layer)\b",text)),mentions_route=bool(re.search(r"\b(route|safest route|navigate)\b",text)))
    candidates=[]
    if re.match(r"\s*(what is|what's|define|meaning of)\s+(a\s+)?pfz", text):
        return IntentClassification(primary_intent=PlannerIntent.GENERAL_INFORMATION,confidence=.9,signals=signals,safety_sensitive=False,classification_source="RULES",conflicts=[])
    if signals.mentions_pfz and re.search(r"\b(best|recommended|recommend|choose|safer|compare|nearest safe|which pfz)\b",text):
        return IntentClassification(primary_intent=PlannerIntent.PFZ_RECOMMENDATION_QUERY,confidence=.92,signals=signals,safety_sensitive=True,classification_source="RULES",conflicts=[])
    if signals.mentions_safe:candidates.append(PlannerIntent.MARINE_RISK_QUERY)
    if signals.mentions_pfz:candidates.append(PlannerIntent.PFZ_QUERY)
    if signals.mentions_alert:candidates.append(PlannerIntent.ALERT_QUERY)
    if signals.mentions_weather:candidates.append(PlannerIntent.WEATHER_QUERY)
    if signals.mentions_waves:candidates.append(PlannerIntent.MARINE_CONDITIONS_QUERY)
    if signals.mentions_chlorophyll:candidates.append(PlannerIntent.OCEAN_PRODUCTIVITY_QUERY)
    if signals.mentions_geofence:candidates.append(PlannerIntent.GEOFENCE_QUERY)
    if signals.mentions_route:candidates.append(PlannerIntent.ROUTE_QUERY)
    if signals.mentions_map:candidates.append(PlannerIntent.MAP_QUERY)
    if not candidates:
        candidates=[PlannerIntent.GENERAL_INFORMATION if text.startswith(("what is","define","meaning of")) else PlannerIntent.UNKNOWN]
    primary=PlannerIntent.MULTI_INTENT if len(candidates)>1 else candidates[0]
    safety=PlannerIntent.MARINE_RISK_QUERY in candidates or PlannerIntent.ALERT_QUERY in candidates or PlannerIntent.ROUTE_QUERY in candidates
    return IntentClassification(primary_intent=primary,secondary_intents=[] if primary != PlannerIntent.MULTI_INTENT else candidates,confidence=.9 if candidates[0] != PlannerIntent.UNKNOWN else .35,signals=signals,safety_sensitive=safety,classification_source="RULES_FALLBACK",conflicts=[])
