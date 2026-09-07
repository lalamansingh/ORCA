"""Opt-in, prominently attributable development alert fixtures."""

from datetime import UTC, datetime, timedelta

from app.domain.alerts import AlertSeverity, AlertSourceType, AlertStatus, AlertType, ProviderAvailability
from app.providers.alerts.base import AlertProvider, AlertProviderResult
from app.schemas.alerts import AlertEvidence, NormalizedMarineAlert


class DemoAlertProvider(AlertProvider):
    name = "ORCA Demo Alerts"

    async def get_alerts(self, **_kwargs) -> AlertProviderResult:  # type: ignore[no-untyped-def]
        now = datetime.now(UTC)
        alert = NormalizedMarineAlert(
            external_id="demo-high-waves-chennai-01",
            type=AlertType.HIGH_WAVES,
            severity=AlertSeverity.CRITICAL,
            title="DEMO DATA — Critical high-wave warning",
            summary="DEMO DATA for interface and integration testing only.",
            description="This is not an official warning and must not be used for navigation or safety decisions.",
            affected_area="Demo coastal area near Chennai",
            geometry={"type": "Polygon", "coordinates": [[[80.25, 12.98], [80.40, 12.98], [80.40, 13.12], [80.25, 13.12], [80.25, 12.98]]]},
            valid_from=now - timedelta(hours=1),
            valid_until=now + timedelta(hours=5),
            issued_at=now - timedelta(hours=1),
            updated_at=now,
            retrieved_at=now,
            source="ORCA development fixture",
            provider=self.name,
            status=AlertStatus.ACTIVE,
            source_type=AlertSourceType.DEMO,
            instructions=["DEMO DATA — follow official authority instructions instead."],
            evidence=AlertEvidence(source="ORCA development fixture", bulletin="DEMO DATA", issued_at=now - timedelta(hours=1), valid_from=now - timedelta(hours=1), valid_until=now + timedelta(hours=5), retrieved_at=now),
            metadata={"demo": True},
        )
        return AlertProviderResult(provider=self.name, status=ProviderAvailability.DEMO, retrieved_at=now, alerts=[alert], message="Explicit demo mode is enabled.")

    def health_status(self) -> ProviderAvailability:
        return ProviderAvailability.DEMO
