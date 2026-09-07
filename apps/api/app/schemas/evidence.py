from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class DataFreshness(StrEnum):
    CURRENT = "CURRENT"
    RECENT = "RECENT"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"


class Measurement(BaseModel):
    value: float
    unit: str


class Location(BaseModel):
    latitude: float
    longitude: float


class DataSource(BaseModel):
    provider: str
    dataset: str
    source_url: str | None = None
    provider_location: Location | None = None


class EvidenceItem(BaseModel):
    parameter: str
    value: float
    unit: str
    source: str
    source_url: str | None = None
    observed_at: datetime | None = None
    retrieved_at: datetime
    freshness: DataFreshness
    confidence: str | None = None
    quality_flag: str | None = None
