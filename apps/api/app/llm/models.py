from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field, model_validator


class IntentCandidate(StrEnum):
    WEATHER="WEATHER"; MARINE_CONDITIONS="MARINE_CONDITIONS"; MARINE_RISK="MARINE_RISK"; PFZ="PFZ"; ALERTS="ALERTS"; OCEAN_PRODUCTIVITY="OCEAN_PRODUCTIVITY"; MAP="MAP"; ROUTE="ROUTE"; GENERAL="GENERAL"; UNKNOWN="UNKNOWN"


class ToolNeed(StrEnum):
    WEATHER="WEATHER"; MARINE="MARINE"; ALERTS="ALERTS"; RISK="RISK"; PFZ="PFZ"; OCEAN_PRODUCTS="OCEAN_PRODUCTS"; GEOSPATIAL="GEOSPATIAL"


class LanguageDetectionResult(BaseModel):
    language_code: str = Field(min_length=2, max_length=12)
    language_name: str = Field(min_length=2, max_length=64)
    confidence: float = Field(ge=0, le=1)
    script: str | None = Field(default=None, max_length=64)


class QueryExtractionResult(BaseModel):
    raw_query: str
    normalized_query: str
    language: LanguageDetectionResult
    requested_location_text: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    requested_time_text: str | None = None
    requested_datetime: datetime | None = None
    resolution_notes: list[str] = Field(default_factory=list)
    entities: list[str] = Field(default_factory=list, max_length=30)
    possible_intents: list[IntentCandidate] = Field(default_factory=list, max_length=8)
    tool_needs: list[ToolNeed] = Field(default_factory=list, max_length=8)
    requires_location: bool = False
    ambiguities: list[str] = Field(default_factory=list, max_length=10)
    needs_clarification: bool = False
    clarification_questions: list[str] = Field(default_factory=list, max_length=5)
    confidence: float = Field(default=0.5, ge=0, le=1)

    @model_validator(mode="after")
    def coordinate_pair(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be supplied together")
        return self


class FactEvidence(BaseModel):
    evidence_id: str = Field(pattern=r"^[a-zA-Z0-9_.:-]{1,128}$")
    parameter: str
    formatted_value: str
    source: str
    source_url: str | None = None
    valid_time: datetime | None = None


class ORCAFactContext(BaseModel):
    weather: dict[str, Any] | None = None
    marine: dict[str, Any] | None = None
    alerts: list[dict[str, Any]] = Field(default_factory=list, max_length=20)
    risk: dict[str, Any] | None = None
    pfz: dict[str, Any] | None = None
    ocean_products: dict[str, Any] | None = None
    selected_location: dict[str, Any] | None = None
    requested_time: str | None = None
    evidence: list[FactEvidence] = Field(default_factory=list, max_length=50)
    availability: dict[str, str] = Field(default_factory=dict)


class ResponseDraft(BaseModel):
    answer: str = Field(min_length=1, max_length=4000)
    summary: str | None = Field(default=None, max_length=500)
    warnings: list[str] = Field(default_factory=list, max_length=10)
    suggested_followups: list[str] = Field(default_factory=list, max_length=5)
    map_actions: list[dict[str, Any]] = Field(default_factory=list, max_length=5)
    evidence_refs: list[str] = Field(default_factory=list, max_length=50)
    language: str = Field(default="en", max_length=12)


class LLMUsage(BaseModel):
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None


class LLMResult(BaseModel):
    data: dict[str, Any]
    provider: str
    model: str
    usage: LLMUsage = Field(default_factory=LLMUsage)
