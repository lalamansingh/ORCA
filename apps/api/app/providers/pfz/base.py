"""Contract for PFZ advisory providers."""

from abc import ABC, abstractmethod
from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.pfz import PFZProviderAvailability
from app.schemas.pfz import NormalizedPotentialFishingZone


class PFZProviderResult(BaseModel):
    provider: str
    status: PFZProviderAvailability
    source_url: str | None = None
    retrieved_at: datetime
    advisories: list[NormalizedPotentialFishingZone] = Field(default_factory=list)
    rejected_count: int = 0
    message: str | None = None


class PFZProvider(ABC):
    name: str

    @abstractmethod
    async def get_current_advisories(self) -> PFZProviderResult:
        """Retrieve and normalize current advisory features without persistence."""

    @abstractmethod
    def health_status(self) -> PFZProviderAvailability:
        """Report configuration-level availability without a request."""
