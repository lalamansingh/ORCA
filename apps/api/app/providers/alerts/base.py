"""Provider contract for safety advisories."""

from abc import ABC, abstractmethod
from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.alerts import ProviderAvailability
from app.schemas.alerts import NormalizedMarineAlert


class AlertProviderResult(BaseModel):
    provider: str
    status: ProviderAvailability
    source_url: str | None = None
    retrieved_at: datetime
    alerts: list[NormalizedMarineAlert] = Field(default_factory=list)
    message: str | None = None


class AlertProvider(ABC):
    name: str

    @abstractmethod
    async def get_alerts(
        self,
        latitude: float | None = None,
        longitude: float | None = None,
        radius_km: float | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> AlertProviderResult:
        """Return validated, provider-independent advisories."""

    @abstractmethod
    def health_status(self) -> ProviderAvailability:
        """Return configuration-level health without issuing a request."""
