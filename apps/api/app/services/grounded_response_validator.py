import re
from app.llm.models import ORCAFactContext,ResponseDraft

UNSAFE_ASSURANCES=re.compile(r"\b(completely safe|guaranteed safe|no danger|safe to go)\b",re.I)
ALLOWED_MAP_ACTIONS={"SHOW_LAYER","FOCUS_LOCATION","HIGHLIGHT_FEATURE","SHOW_ROUTE","FIT_ROUTE","HIGHLIGHT_ROUTE_SEGMENT","SHOW_ROUTE_ALTERNATIVE"}
ALLOWED_LAYERS={"pfz","sst","chlorophyll","waves","currents","weather","alerts","boundaries","restricted","protected","route","saved"}
class GroundedResponseValidator:
    def validate(self,draft:ResponseDraft,context:ORCAFactContext)->ResponseDraft:
        risk=str((context.risk or {}).get("level",(context.risk or {}).get("risk_level",""))).upper();geofence=str((context.geofence or {}).get("overall_status",""))
        if risk in {"HIGH","EXTREME"} and UNSAFE_ASSURANCES.search(draft.answer):raise ValueError("LLM_SAFETY_CONTRADICTION")
        if geofence=="PROHIBITED" and re.search(r"\b(enter|proceed|allowed)\b",draft.answer,re.I):raise ValueError("LLM_GEOFENCE_CONTRADICTION")
        draft.map_actions=[item for item in draft.map_actions if item.get("action") in ALLOWED_MAP_ACTIONS and (not item.get("layer") or item.get("layer") in ALLOWED_LAYERS)]
        return draft
