from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

from app.domain.ocean_products import OceanProduct, OceanProductStatus, OceanQuality
from app.schemas.evidence import Location


class OceanProductMetadata(BaseModel):
    product: OceanProduct
    status: OceanProductStatus
    provider: str
    dataset: str
    units: str
    valid_time: datetime | None = None
    retrieved_at: datetime
    spatial_resolution: str | None = None
    temporal_resolution: str | None = None
    bounding_box: tuple[float, float, float, float] | None = None
    projection: str = "EPSG:4326"
    source_url: HttpUrl | None = None
    quality_notes: str | None = None
    access_notes: str | None = None
    map_access: dict[str, object] = Field(default_factory=dict)


class OceanSample(BaseModel):
    product: OceanProduct
    value: float | None = None
    unit: str
    status: OceanProductStatus
    quality: OceanQuality
    valid_time: datetime | None = None
    retrieved_at: datetime
    provider: str
    source_url: HttpUrl | None = None
    sampled_location: Location | None = None
    distance_to_grid_point_km: float | None = None
    sample_method: str
    evidence: dict[str, object] = Field(default_factory=dict)


class OceanProductsResponse(BaseModel):
    products: list[OceanProductMetadata]


class OceanSampleResponse(BaseModel):
    location: Location
    samples: dict[str, OceanSample]
