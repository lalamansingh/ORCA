"""Explicitly labelled local PFZ fixture."""

from datetime import UTC, datetime

from app.domain.pfz import PFZProviderAvailability, PFZStatus
from app.providers.pfz.base import PFZProvider, PFZProviderResult
from app.schemas.pfz import NormalizedPotentialFishingZone, PFZEvidence


class DemoPFZProvider(PFZProvider):
    name = "ORCA Demo PFZ"

    async def get_current_advisories(self) -> PFZProviderResult:
        now = datetime.now(UTC)
        advisory = NormalizedPotentialFishingZone(external_id="demo-pfz-chennai-01", name="DEMO DATA — PFZ South-East", geometry={"type": "Polygon", "coordinates": [[[80.34, 13.00], [80.38, 13.00], [80.38, 13.04], [80.34, 13.04], [80.34, 13.00]]]}, source="ORCA development fixture", provider=self.name, advisory_date=None, retrieved_at=now, status=PFZStatus.DEMO, confidence="Demo", evidence=PFZEvidence(source="ORCA development fixture", retrieved_at=now), metadata={"demo": True})
        return PFZProviderResult(provider=self.name, status=PFZProviderAvailability.DEMO, retrieved_at=now, advisories=[advisory], message="Explicit demo mode is enabled.")

    def health_status(self) -> PFZProviderAvailability:
        return PFZProviderAvailability.DEMO
