import json
from typing import TypeVar
import httpx
from pydantic import BaseModel, ValidationError
from app.llm.base import LLMProvider
from app.llm.models import LLMResult, LLMUsage

SchemaT = TypeVar("SchemaT", bound=BaseModel)


class OpenAILLMProvider(LLMProvider):
    name = "OpenAI"

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
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens

    async def generate_text(self, system: str, prompt: str) -> str:
        response = await self._request(system, prompt, None)
        return self._extract_text(response)

    async def generate_structured(self, system: str, prompt: str, schema: type[SchemaT]) -> tuple[SchemaT, LLMResult]:
        last_error: Exception | None = None
        for _ in range(self.max_retries + 1):
            try:
                payload = await self._request(system, prompt, schema)
                text = self._extract_text(payload)
                data = schema.model_validate_json(text)
                usage = payload.get("usage", {})
                return data, LLMResult(
                    data=data.model_dump(mode="json"),
                    provider=self.name,
                    model=str(payload.get("model", self.model)),
                    usage=LLMUsage(
                        input_tokens=usage.get("prompt_tokens") or usage.get("input_tokens"),
                        output_tokens=usage.get("completion_tokens") or usage.get("output_tokens"),
                        total_tokens=usage.get("total_tokens"),
                    ),
                )
            except (httpx.HTTPError, ValueError, ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
        raise ValueError("LLM_OUTPUT_INVALID") from last_error

    async def _request(self, system: str, prompt: str, schema: type[BaseModel] | None) -> dict:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        body: dict = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_output_tokens,
        }
        if schema:
            body["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": schema.__name__,
                    "strict": True,
                    "schema": schema.model_json_schema(),
                },
            }

        response = await self.client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json=body,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    @staticmethod
    def _extract_text(payload: dict) -> str:
        choices = payload.get("choices", [])
        if choices:
            msg = choices[0].get("message", {})
            return str(msg.get("content", ""))
        for item in payload.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in {"output_text", "text"}:
                    return str(content.get("text", ""))
        raise ValueError("missing text output in OpenAI response")

    def health_status(self) -> str:
        return "OPERATIONAL" if self.api_key else "NOT_CONFIGURED"
