import logging
import time
from app.llm.base import LLMProvider
from app.llm.models import QueryExtractionResult
from app.llm.prompts import ORCA_SYSTEM_PROMPT,QUERY_EXTRACTION_PROMPT

logger=logging.getLogger(__name__)


class QueryUnderstandingService:
    def __init__(self,provider:LLMProvider,max_input_chars:int)->None:self.provider,self.max_input_chars=provider,max_input_chars
    async def extract(self,query:str)->QueryExtractionResult:
        if len(query)>self.max_input_chars:raise ValueError("AI_INPUT_TOO_LONG")
        started=time.perf_counter()
        try:
            result,metadata=await self.provider.generate_structured(ORCA_SYSTEM_PROMPT,f"{QUERY_EXTRACTION_PROMPT}\nUSER_QUERY:\n{query}",QueryExtractionResult)
            logger.info("llm_call operation=query_extraction provider=%s model=%s status=success latency_ms=%.2f input_tokens=%s output_tokens=%s",metadata.provider,metadata.model,(time.perf_counter()-started)*1000,metadata.usage.input_tokens,metadata.usage.output_tokens)
            return result
        except Exception as exc:
            logger.warning("llm_call operation=query_extraction provider=%s model=%s status=failure failure_type=%s",self.provider.name,self.provider.model,type(exc).__name__)
            raise ValueError("LLM_OUTPUT_INVALID") from exc
