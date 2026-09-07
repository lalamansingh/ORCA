"""Fetch, validate and upsert configured alert providers once."""

import asyncio

import httpx

from app.core.config import get_settings
from app.db.session import create_database_engine, create_session_factory
from app.providers.factory import get_alert_providers
from app.services.alert_service import AlertService
from app.services.data_source_logger import DataSourceLogger
from app.services.forecast_cache import TTLCache
from app.services.provider_status import ProviderStatusRegistry


async def refresh() -> int:
    settings = get_settings()
    engine = create_database_engine(settings.database_url)
    factory = create_session_factory(engine)
    try:
        async with httpx.AsyncClient(headers={"User-Agent": "ORCA/0.1 alert-refresh"}) as client:
            providers = get_alert_providers(settings, client)
            service = AlertService(providers, TTLCache(), settings.alert_cache_ttl, factory, DataSourceLogger(factory), ProviderStatusRegistry())
            alerts, results, persisted = await service.refresh(force=True)
            for result in results:
                print(f"{result.provider}: {result.status.value} ({len(result.alerts)} alert(s))")
            print(f"Normalized: {len(alerts)}; persistence: {'complete' if persisted else 'unavailable'}")
            return 0 if any(result.status.value in {"OPERATIONAL", "DEGRADED", "DEMO"} for result in results) else 1
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(refresh()))
