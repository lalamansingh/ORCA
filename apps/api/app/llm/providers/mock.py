import re
from typing import TypeVar
from pydantic import BaseModel
from app.llm.base import LLMProvider
from app.llm.models import IntentCandidate, LLMResult, LLMUsage, LanguageDetectionResult, QueryExtractionResult, ResponseDraft, ToolNeed

SchemaT=TypeVar("SchemaT",bound=BaseModel)
COORDINATES=re.compile(r"(?<!\d)(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)(?!\d)")


class MockLLMProvider(LLMProvider):
    name="ORCA Mock LLM"; model="orca-mock-v1"

    async def generate_text(self, system:str,prompt:str)->str: return "Mock output"

    async def generate_structured(self,system:str,prompt:str,schema:type[SchemaT])->tuple[SchemaT,LLMResult]:
        if schema is QueryExtractionResult:
            query=prompt.split("USER_QUERY:\n",1)[-1].strip(); lower=query.lower()
            devanagari=any("\u0900"<=char<="\u097f" for char in query); hinglish=any(term in lower.split() for term in ("kal","subah","samundar","jana","kya","dikhao","yahan"))
            language=LanguageDetectionResult(language_code="hi" if devanagari or hinglish else "en",language_name="Hindi" if devanagari or hinglish else "English",confidence=.9,script="Devanagari" if devanagari else "Latin")
            intents=[]; tools=[]
            def add(intent:IntentCandidate,tool:ToolNeed|None=None):
                if intent not in intents:intents.append(intent)
                if tool and tool not in tools:tools.append(tool)
            if any(term in lower for term in ("safe","risk","surakshit")):add(IntentCandidate.MARINE_RISK,ToolNeed.RISK)
            if any(term in lower for term in ("weather","mausam")):add(IntentCandidate.WEATHER,ToolNeed.WEATHER)
            if any(term in lower for term in ("wave","samundar","marine","sea")):add(IntentCandidate.MARINE_CONDITIONS,ToolNeed.MARINE)
            if any(term in lower for term in ("pfz","fishing zone","nearest fishing","dikhao")):add(IntentCandidate.PFZ,ToolNeed.PFZ)
            if any(term in lower for term in ("alert","warning")):add(IntentCandidate.ALERTS,ToolNeed.ALERTS)
            if any(term in lower for term in ("chlorophyll","productivity","sst")):add(IntentCandidate.OCEAN_PRODUCTIVITY,ToolNeed.OCEAN_PRODUCTS)
            match=COORDINATES.search(query); lat=float(match.group(1)) if match else None; lon=float(match.group(2)) if match else None
            time_text=next((phrase for phrase in ("tomorrow morning","next 6 hours","tonight","today","now","kal subah","kal") if phrase in lower),None)
            location=next((name for name in ("Chennai","Mumbai","Kochi","Goa") if name.lower() in lower),None)
            requires=any(item in intents for item in (IntentCandidate.MARINE_RISK,IntentCandidate.PFZ,IntentCandidate.ALERTS,IntentCandidate.WEATHER,IntentCandidate.MARINE_CONDITIONS))
            ambiguities=[]
            if time_text in {"tomorrow morning","kal subah","kal"}:ambiguities.append("Exact requested time is not specified.")
            if requires and lat is None and location is None:ambiguities.append("A precise location is required; place names are not geocoded by the LLM.")
            data=QueryExtractionResult(raw_query=query,normalized_query=" ".join(query.split()),language=language,requested_location_text=location,latitude=lat,longitude=lon,requested_time_text=time_text,resolution_notes=["Time wording was preserved and not silently resolved."] if time_text else [],entities=[value for value in (location,time_text) if value],possible_intents=intents or [IntentCandidate.UNKNOWN],tool_needs=tools,requires_location=requires,ambiguities=ambiguities,needs_clarification=bool(ambiguities),clarification_questions=["Which exact location should ORCA use?"] if requires and lat is None and location is None else [],confidence=.86)
            return data,LLMResult(data=data.model_dump(mode="json"),provider=self.name,model=self.model,usage=LLMUsage(input_tokens=len(query.split()),output_tokens=40,total_tokens=len(query.split())+40)) # type: ignore[return-value]
        if schema is ResponseDraft:
            data=ResponseDraft(answer="ORCA can format only the supplied deterministic facts. Missing information remains unavailable.",warnings=[],evidence_refs=[],language="en")
            return data,LLMResult(data=data.model_dump(),provider=self.name,model=self.model) # type: ignore[return-value]
        raise ValueError("Unsupported mock schema")

    def health_status(self)->str:return "OPERATIONAL"
