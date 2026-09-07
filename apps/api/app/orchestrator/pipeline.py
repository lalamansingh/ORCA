from app.llm.models import LanguageDetectionResult,QueryExtractionResult
from app.services.query_understanding_service import QueryUnderstandingService
from app.planner.planner import QueryPlanner
from app.orchestrator.models import OrchestrationResult
from app.orchestrator.service import ORCAOrchestrator


class ORCAQueryExecutionService:
    def __init__(self,orchestrator:ORCAOrchestrator,provider=None,max_input_chars:int=4000):self.orchestrator,self.provider,self.max_input_chars=orchestrator,provider,max_input_chars
    async def execute(self,query:str,selected_location:dict|None=None)->OrchestrationResult:
        if self.provider:
            try: extraction=await QueryUnderstandingService(self.provider,self.max_input_chars).extract(query)
            except Exception: extraction=self._fallback(query)
        else:extraction=self._fallback(query)
        plan=QueryPlanner().plan(extraction,selected_location)
        return await self.orchestrator.execute(plan,query,selected_location)
    @staticmethod
    def _fallback(query:str)->QueryExtractionResult:
        text=query.lower();return QueryExtractionResult(raw_query=query,normalized_query=" ".join(query.split()),language=LanguageDetectionResult(language_code="hi" if any(term in text for term in ("kal","subah","samundar")) else "en",language_name="Hindi" if any(term in text for term in ("kal","subah","samundar")) else "English",confidence=.5),requires_location=any(term in text for term in ("weather","wave","safe","risk","pfz","alert")),requested_time_text=next((term for term in ("tomorrow morning","kal subah","tomorrow","today","now") if term in text),None))
