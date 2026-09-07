"""Multi-provider alert orchestration, persistence and deterministic summaries."""

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from uuid import NAMESPACE_URL, UUID, uuid5

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.domain.alerts import AlertFreshness, AlertSeverity, AlertStatus, AlertType, ProviderAvailability
from app.providers.alerts.base import AlertProvider, AlertProviderResult
from app.providers.errors import ProviderError
from app.repositories.alerts import AlertRepository
from app.schemas.alerts import AlertListResponse, AlertProviderSource, AlertSummary, MarineAlertRead, NormalizedMarineAlert
from app.schemas.evidence import Location
from app.services.data_source_logger import DataSourceLogger
from app.services.forecast_cache import TTLCache
from app.services.provider_status import ProviderStatusRegistry

logger = logging.getLogger(__name__)
SEVERITY_ORDER = {AlertSeverity.INFO: 0, AlertSeverity.WATCH: 1, AlertSeverity.WARNING: 2, AlertSeverity.SEVERE: 3, AlertSeverity.CRITICAL: 4}


class AlertService:
    def __init__(self, providers: list[AlertProvider], cache: TTLCache, cache_ttl: int, session_factory: async_sessionmaker, source_logger: DataSourceLogger, registry: ProviderStatusRegistry) -> None:
        self.providers, self.cache, self.cache_ttl = providers, cache, cache_ttl
        self.session_factory, self.source_logger, self.registry = session_factory, source_logger, registry

    async def _provider_result(self, provider: AlertProvider, refresh: bool) -> AlertProviderResult:
        key = f"alerts:{provider.name}"
        if not refresh and (cached := await self.cache.get(key)) is not None:
            return cached  # type: ignore[return-value]
        started = datetime.now(UTC)
        try:
            result = await provider.get_alerts()
            await self.cache.set(key, result, self.cache_ttl)
            code = None
        except ProviderError as exc:
            result = AlertProviderResult(provider=provider.name, status=ProviderAvailability.UNAVAILABLE, retrieved_at=datetime.now(UTC), message="Provider data could not be retrieved safely.")
            code = type(exc).__name__
        elapsed = (datetime.now(UTC) - started).total_seconds() * 1000
        kind = "alerts_imd" if provider.name.startswith("IMD") else "alerts_incois" if provider.name.startswith("INCOIS") else "alerts_demo"
        self.registry.set_status(kind, result.status.value, code)
        await self.source_logger.record(provider.name, "get_alerts", result.status.value, elapsed, code, {"alert_count": len(result.alerts)})
        return result

    async def refresh(self, force: bool = False) -> tuple[list[NormalizedMarineAlert], list[AlertProviderResult], bool]:
        results = await asyncio.gather(*(self._provider_result(provider, force) for provider in self.providers))
        unique: dict[tuple[str, str], NormalizedMarineAlert] = {}
        for result in results:
            for alert in result.alerts:
                unique[(alert.provider, alert.external_id)] = alert
        alerts = list(unique.values())
        persisted = True
        if alerts:
            try:
                async with self.session_factory() as session:
                    await AlertRepository(session).upsert_many(alerts)
            except Exception as exc:
                logger.warning("alert_persistence_unavailable error_type=%s", type(exc).__name__)
                persisted = False
        return alerts, list(results), persisted

    async def list_alerts(
        self, *, latitude: float, longitude: float, radius_km: float | None = None,
        status: AlertStatus | None = None, alert_type: AlertType | None = None,
        severity: AlertSeverity | None = None, start_time: datetime | None = None,
        end_time: datetime | None = None, active_only: bool = False, refresh: bool = False,
    ) -> AlertListResponse:
        now = datetime.now(UTC)
        provider_alerts, results, persisted = await self.refresh(refresh)
        if active_only:
            status = AlertStatus.ACTIVE
            start_time = now
        alerts: list[MarineAlertRead] = []
        if persisted:
            try:
                async with self.session_factory() as session:
                    alerts = await AlertRepository(session).list_filtered(latitude=latitude, longitude=longitude, radius_km=radius_km, status=status, alert_type=alert_type, severity=severity, start_time=start_time, end_time=end_time, alert_id=None, include_demo=any(provider.name == "ORCA Demo Alerts" for provider in self.providers))
            except Exception:
                logger.warning("alert_query_unavailable")
                persisted = False
        if not persisted:
            alerts = [_fallback_read(alert) for alert in provider_alerts if _matches(alert, status, alert_type, severity, start_time, end_time, active_only, now)]
        for alert in alerts:
            alert.freshness = freshness(alert, now)
        available = [result for result in results if result.status in {ProviderAvailability.OPERATIONAL, ProviderAvailability.DEGRADED, ProviderAvailability.DEMO}]
        unavailable = [result for result in results if result.status not in {ProviderAvailability.OPERATIONAL, ProviderAvailability.DEMO}]
        response_status = "unavailable" if not available else "partial" if unavailable or not persisted else "complete"
        if response_status == "unavailable":
            result_state = "PROVIDER_UNAVAILABLE"
        elif alerts:
            result_state = "ALERTS_AVAILABLE"
        elif active_only:
            result_state = "NO_ACTIVE_ALERTS"
        else:
            result_state = "NO_ALERTS_FOUND"
        limitations = []
        if not persisted:
            limitations.append("PostGIS persistence or proximity lookup is unavailable; distance and containment are not reported.")
        if any(alert.geometry is None for alert in alerts):
            limitations.append("Some official advisories provide textual affected areas without mappable geometry.")
        return AlertListResponse(
            location=Location(latitude=latitude, longitude=longitude), status=response_status, result_state=result_state,
            alerts=alerts, summary=summary(alerts), sources=[_source(result) for result in results], retrieved_at=now,
            limitations=limitations,
        )

    async def detail(self, alert_id: UUID, latitude: float | None = None, longitude: float | None = None) -> MarineAlertRead | None:
        try:
            async with self.session_factory() as session:
                alert = await AlertRepository(session).by_id(alert_id, latitude, longitude, any(provider.name == "ORCA Demo Alerts" for provider in self.providers))
            if alert:
                alert.freshness = freshness(alert, datetime.now(UTC))
                return alert
        except Exception:
            logger.warning("alert_detail_query_unavailable")
        for provider in self.providers:
            cached = await self.cache.get(f"alerts:{provider.name}")
            if isinstance(cached, AlertProviderResult):
                for candidate in cached.alerts:
                    fallback = _fallback_read(candidate)
                    if fallback.id == alert_id:
                        fallback.freshness = freshness(fallback, datetime.now(UTC))
                        return fallback
        return None


def freshness(alert: MarineAlertRead, now: datetime) -> AlertFreshness:
    if alert.status == AlertStatus.EXPIRED or (alert.valid_until and alert.valid_until < now):
        return AlertFreshness.EXPIRED
    age = now - alert.retrieved_at
    if age <= timedelta(minutes=30):
        return AlertFreshness.CURRENT
    if age <= timedelta(hours=6):
        return AlertFreshness.RECENT
    return AlertFreshness.STALE if alert.retrieved_at else AlertFreshness.UNKNOWN


def summary(alerts: list[MarineAlertRead]) -> AlertSummary:
    counts = {severity: 0 for severity in AlertSeverity}
    for alert in alerts:
        counts[alert.severity] += 1
    highest = max((alert.severity for alert in alerts), key=lambda value: SEVERITY_ORDER[value], default=None)
    return AlertSummary(critical=counts[AlertSeverity.CRITICAL], severe=counts[AlertSeverity.SEVERE], warning=counts[AlertSeverity.WARNING], watch=counts[AlertSeverity.WATCH], info=counts[AlertSeverity.INFO], highest_severity=highest)


def _source(result: AlertProviderResult) -> AlertProviderSource:
    return AlertProviderSource(provider=result.provider, status=result.status, source_url=result.source_url, retrieved_at=result.retrieved_at, alert_count=len(result.alerts), message=result.message)


def _matches(alert: NormalizedMarineAlert, status: AlertStatus | None, alert_type: AlertType | None, severity: AlertSeverity | None, start: datetime | None, end: datetime | None, active: bool, now: datetime) -> bool:
    if (status and alert.status != status) or (alert_type and alert.type != alert_type) or (severity and alert.severity != severity):
        return False
    if active and (alert.status != AlertStatus.ACTIVE or (alert.valid_until and alert.valid_until < now)):
        return False
    if start and alert.valid_until and alert.valid_until < start:
        return False
    return not (end and alert.valid_from and alert.valid_from > end)


def _fallback_read(alert: NormalizedMarineAlert) -> MarineAlertRead:
    return MarineAlertRead(**alert.model_dump(), id=uuid5(NAMESPACE_URL, f"{alert.provider}:{alert.external_id}"), created_at=None, distance_km=None, is_inside=None, nearest_point=None, freshness=AlertFreshness.UNKNOWN)
