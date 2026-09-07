"""Manually refresh PFZ advisories; scheduling is an operator concern."""

import asyncio

import httpx

from app.core.config import get_settings
from app.db.session import create_database_engine, create_session_factory
from app.providers.factory import get_pfz_providers
from app.services.data_source_logger import DataSourceLogger
from app.services.pfz_service import PFZService
from app.services.provider_status import ProviderStatusRegistry


async def main() -> None:
    settings = get_settings()
    engine = create_database_engine(settings.database_url)
    async with httpx.AsyncClient(headers={"User-Agent": "ORCA/0.1 PFZ refresh"}) as client:
        factory = create_session_factory(engine)
        service = PFZService(get_pfz_providers(settings, client), factory, DataSourceLogger(factory), ProviderStatusRegistry())
        for result in await service.refresh():
            print(f"{result.provider}: {result.status.value} ({len(result.advisories)} advisories, {result.rejected_count} rejected)")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
