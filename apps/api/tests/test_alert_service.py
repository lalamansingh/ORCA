from datetime import UTC, datetime, timedelta

import pytest

from app.domain.alerts import AlertSeverity, AlertSourceType, AlertStatus, AlertType, ProviderAvailability
from app.providers.alerts.base import AlertProvider, AlertProviderResult
from app.providers.errors import ProviderUnavailableError
from app.schemas.alerts import AlertEvidence, NormalizedMarineAlert
from app.services.alert_service import AlertService
from app.services.forecast_cache import TTLCache
from app.services.provider_status import ProviderStatusRegistry

NOW = datetime.now(UTC)


def fixture_alert(external_id: str = "wave-1", *, severity: AlertSeverity = AlertSeverity.SEVERE, status: AlertStatus = AlertStatus.ACTIVE, title: str = "High-wave advisory") -> NormalizedMarineAlert:
    return NormalizedMarineAlert(external_id=external_id, type=AlertType.HIGH_WAVES, severity=severity, title=title, summary="Official test fixture", affected_area="Test coast", valid_from=NOW - timedelta(hours=1), valid_until=NOW + timedelta(hours=2) if status == AlertStatus.ACTIVE else NOW - timedelta(hours=1), issued_at=NOW - timedelta(hours=1), retrieved_at=NOW, source="Test authority", provider="IMD CAP", status=status, source_type=AlertSourceType.OFFICIAL_ADVISORY, evidence=AlertEvidence(source="Test authority", bulletin="Test", retrieved_at=NOW))


class FakeProvider(AlertProvider):
    def __init__(self, name: str, result: AlertProviderResult | Exception) -> None:
        self.name, self.result = name, result
    async def get_alerts(self, **_kwargs) -> AlertProviderResult:  # type: ignore[no-untyped-def]
        if isinstance(self.result, Exception): raise self.result
        return self.result
    def health_status(self) -> ProviderAvailability: return ProviderAvailability.OPERATIONAL


class FakeLogger:
    async def record(self, *_args, **_kwargs) -> None: pass


class FailingContext:
    async def __aenter__(self): raise RuntimeError("database unavailable")
    async def __aexit__(self, *_args): return False


class FailingFactory:
    def __call__(self): return FailingContext()


def service(*providers: AlertProvider) -> AlertService:
    return AlertService(list(providers), TTLCache(), 900, FailingFactory(), FakeLogger(), ProviderStatusRegistry())  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_partial_provider_failure_returns_available_alerts() -> None:
    good = AlertProviderResult(provider="IMD CAP", status=ProviderAvailability.OPERATIONAL, retrieved_at=NOW, alerts=[fixture_alert()])
    result = await service(FakeProvider("IMD CAP", good), FakeProvider("INCOIS Alerts", ProviderUnavailableError("offline"))).list_alerts(latitude=13, longitude=80, active_only=True)
    assert result.status == "partial"
    assert result.result_state == "ALERTS_AVAILABLE"
    assert len(result.alerts) == 1
    assert result.alerts[0].distance_km is None
    assert result.summary.severe == 1


@pytest.mark.asyncio
async def test_provider_empty_is_not_reported_as_unavailable() -> None:
    empty = AlertProviderResult(provider="IMD CAP", status=ProviderAvailability.OPERATIONAL, retrieved_at=NOW)
    result = await service(FakeProvider("IMD CAP", empty)).list_alerts(latitude=13, longitude=80, active_only=True)
    assert result.status == "partial"  # the test database is intentionally unavailable
    assert result.result_state == "NO_ACTIVE_ALERTS"


@pytest.mark.asyncio
async def test_all_provider_failure_is_controlled_unavailable() -> None:
    result = await service(FakeProvider("IMD CAP", ProviderUnavailableError("raw upstream detail"))).list_alerts(latitude=13, longitude=80, active_only=True)
    assert result.status == "unavailable"
    assert result.result_state == "PROVIDER_UNAVAILABLE"
    assert result.sources[0].message == "Provider data could not be retrieved safely."


@pytest.mark.asyncio
async def test_fallback_filters_status_type_and_severity() -> None:
    current = fixture_alert(severity=AlertSeverity.CRITICAL)
    expired = fixture_alert("old", status=AlertStatus.EXPIRED)
    response = AlertProviderResult(provider="IMD CAP", status=ProviderAvailability.OPERATIONAL, retrieved_at=NOW, alerts=[current, expired])
    result = await service(FakeProvider("IMD CAP", response)).list_alerts(latitude=13, longitude=80, active_only=True, severity=AlertSeverity.CRITICAL, alert_type=AlertType.HIGH_WAVES)
    assert [item.external_id for item in result.alerts] == ["wave-1"]


@pytest.mark.asyncio
async def test_duplicate_provider_identifier_is_deduplicated_with_latest_record() -> None:
    first = fixture_alert(title="First")
    updated = fixture_alert(title="Updated")
    response = AlertProviderResult(provider="IMD CAP", status=ProviderAvailability.OPERATIONAL, retrieved_at=NOW, alerts=[first, updated])
    alerts, _, persisted = await service(FakeProvider("IMD CAP", response)).refresh()
    assert not persisted
    assert len(alerts) == 1
    assert alerts[0].title == "Updated"
