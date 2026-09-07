from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.db.models import LocationType

class SavedLocationCreate(BaseModel):
    name: str = Field(max_length=255)
    location_type: LocationType
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

class SavedLocationRead(SavedLocationCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    language: str
    created_at: datetime
    updated_at: datetime

class SpatialRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    source: str
    created_at: datetime
    updated_at: datetime

class PotentialFishingZoneRead(SpatialRecordRead):
    confidence: str | None

class MarineZoneRead(SpatialRecordRead):
    zone_type: str

class MarineRouteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    distance_km: float | None
    estimated_duration_minutes: int | None
    created_at: datetime
    updated_at: datetime
