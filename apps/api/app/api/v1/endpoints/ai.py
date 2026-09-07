"""Controlled Step 11 query-understanding endpoint; it executes no marine tools."""
from fastapi import APIRouter,HTTPException,Request,status
from app.llm.factory import get_llm_provider
from app.llm.models import QueryExtractionResult
from app.schemas.ai import QueryInput
from app.services.query_understanding_service import QueryUnderstandingService

router=APIRouter(prefix="/ai")


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
