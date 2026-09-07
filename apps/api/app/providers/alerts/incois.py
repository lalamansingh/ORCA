"""Explicit placeholder for a future verified INCOIS structured alert feed."""

from datetime import UTC, datetime

from app.domain.alerts import ProviderAvailability
from app.providers.alerts.base import AlertProvider, AlertProviderResult


class IncoisAlertProvider(AlertProvider):
    name = "INCOIS Alerts"
    information_url = "https://www.incois.gov.in/site/services/osf.jsp"

    async def get_alerts(self, **_kwargs) -> AlertProviderResult:  # type: ignore[no-untyped-def]
        return AlertProviderResult(
            provider=self.name,
            status=ProviderAvailability.NOT_CONNECTED,
            source_url=self.information_url,
            retrieved_at=datetime.now(UTC),
            message="No verified stable public structured INCOIS alert feed is configured.",
        )

    def health_status(self) -> ProviderAvailability:
        return ProviderAvailability.NOT_CONNECTED
