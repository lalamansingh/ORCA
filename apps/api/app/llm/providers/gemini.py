import json
from typing import TypeVar
import httpx
from pydantic import BaseModel, ValidationError
from app.llm.base import LLMProvider
from app.llm.models import LLMResult, LLMUsage

SchemaT = TypeVar("SchemaT", bound=BaseModel)


class GeminiLLMProvider(LLMProvider):
    name = "Gemini"

    def __init__(
        self,
        client: httpx.AsyncClient,
        api_key: str,
        model: str,
        timeout: float,
        max_retries: int,
        temperature: float,
        max_output_tokens: int,
    ) -> None:
        self.client = client
        self.api_key = api_key
        self.model = model.replace("models/", "")
        self.timeout = timeout
        self.max_retries = max_retries
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens

    async def generate_text(self, system: str, prompt: str) -> str:
        payload = await self._request(system, prompt, None)
        return self._extract_text(payload)

    async def generate_structured(self, system: str, prompt: str, schema: type[SchemaT]) -> tuple[SchemaT, LLMResult]:
        last_error: Exception | None = None
        for _ in range(self.max_retries + 1):
            try:
                payload = await self._request(system, prompt, schema)
                text = self._extract_text(payload)
                data = schema.model_validate_json(text)
                usage_meta = payload.get("usageMetadata", {})
                return data, LLMResult(
                    data=data.model_dump(mode="json"),
                    provider=self.name,
                    model=self.model,
                    usage=LLMUsage(
                        input_tokens=usage_meta.get("promptTokenCount"),
                        output_tokens=usage_meta.get("candidatesTokenCount"),
                        total_tokens=usage_meta.get("totalTokenCount"),
                    ),
                )
            except (httpx.HTTPError, ValueError, ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
        raise ValueError("LLM_OUTPUT_INVALID") from last_error

    async def _request(self, system: str, prompt: str, schema: type[BaseModel] | None) -> dict:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        body: dict = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_output_tokens,
            },
        }
        if system:
            body["systemInstruction"] = {"parts": [{"text": system}]}
        if schema:
            body["generationConfig"]["responseMimeType"] = "application/json"

        response = await self.client.post(
            url,
            params={"key": self.api_key},
            headers={"Content-Type": "application/json"},
            json=body,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    @staticmethod
    def _extract_text(payload: dict) -> str:
        candidates = payload.get("candidates", [])
        if not candidates:
            raise ValueError("missing candidates in Gemini response")
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise ValueError("missing parts in Gemini response")
        return str(parts[0].get("text", ""))

    def health_status(self) -> str:
        return "OPERATIONAL" if self.api_key else "NOT_CONFIGURED"
