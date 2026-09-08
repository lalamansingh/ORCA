import httpx
from app.core.config import Settings
from app.llm.base import LLMProvider
from app.llm.providers.mock import MockLLMProvider
from app.llm.providers.openai import OpenAILLMProvider
from app.llm.providers.gemini import GeminiLLMProvider


def get_llm_provider(settings:Settings,client:httpx.AsyncClient)->LLMProvider|None:
    if not settings.llm_enabled:return None
    if settings.llm_provider=="mock":return MockLLMProvider()
    if settings.llm_provider=="openai" and settings.openai_api_key:return OpenAILLMProvider(client,settings.openai_api_key,settings.openai_model,settings.llm_timeout_seconds,settings.llm_max_retries,settings.llm_temperature,settings.llm_max_output_tokens)
    if settings.llm_provider=="gemini" and settings.gemini_api_key:return GeminiLLMProvider(client,settings.gemini_api_key,settings.gemini_model,settings.llm_timeout_seconds,settings.llm_max_retries,settings.llm_temperature,settings.llm_max_output_tokens)
    return None
