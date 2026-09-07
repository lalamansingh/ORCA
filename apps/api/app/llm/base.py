from abc import ABC, abstractmethod
from typing import TypeVar
from pydantic import BaseModel
from app.llm.models import LLMResult

SchemaT = TypeVar("SchemaT", bound=BaseModel)


class LLMProvider(ABC):
    name: str
    model: str

    @abstractmethod
    async def generate_text(self, system: str, prompt: str) -> str: ...

    @abstractmethod
    async def generate_structured(self, system: str, prompt: str, schema: type[SchemaT]) -> tuple[SchemaT, LLMResult]: ...

    @abstractmethod
    def health_status(self) -> str: ...
