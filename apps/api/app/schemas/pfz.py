"""PFZ provider and public API contracts."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.domain.pfz import PFZProviderAvailability, PFZStatus
from app.schemas.evidence import Location
from app.schemas.geojson import GeoJSONGeometry


class PFZEvidence(BaseModel):
    source: str
    source_url: HttpUrl | None = None
    advisory_date: date | None = None
    retrieved_at: datetime
    source_timestamp: str | None = None


class NormalizedPotentialFishingZone(BaseModel):
    external_id: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=255)
    geometry: GeoJSONGeometry
    sector: str | None = Field(default=None, max_length=255)
    source: str = Field(min_length=1, max_length=255)
    provider: str = Field(min_length=1, max_length=100)
    source_url: HttpUrl | None = None
    advisory_date: date | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    retrieved_at: datetime
    status: PFZStatus
    confidence: str | None = Field(default=None, max_length=32)
    evidence: PFZEvidence
    metadata: dict[str, object] = Field(default_factory=dict)


class PotentialFishingZoneRead(NormalizedPotentialFishingZone):
    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    distance_km: float | None = None
    bearing_degrees: float | None = None
    bearing_cardinal: str | None = None
    nearest_point: Location | None = None


class PFZProviderSource(BaseModel):
    provider: str
    status: PFZProviderAvailability
    source_url: HttpUrl | None = None
    retrieved_at: datetime
    advisory_count: int = 0
    message: str | None = None


class PFZListResponse(BaseModel):
    location: Location
    status: str
    result_state: str
    pfzs: list[PotentialFishingZoneRead] = Field(default_factory=list)
    sources: list[PFZProviderSource] = Field(default_factory=list)
    retrieved_at: datetime
    limitations: list[str] = Field(default_factory=list)


class PFZGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: UUID
    geometry: GeoJSONGeometry
    properties: dict[str, object]


class PFZGeoJSONResponse(BaseModel):
    type: str = "FeatureCollection"
    features: list[PFZGeoJSONFeature] = Field(default_factory=list)
