"""PFZ ingestion and proximity service. Requests never trigger source refreshes."""

import asyncio
import json
import logging
import math
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.domain.pfz import PFZProviderAvailability, PFZStatus
from app.providers.errors import ProviderError
from app.providers.pfz.base import PFZProvider, PFZProviderResult
from app.repositories.pfz import PFZRepository
from app.schemas.evidence import Location
from app.schemas.pfz import PFZGeoJSONFeature, PFZGeoJSONResponse, PFZListResponse, PFZProviderSource, PotentialFishingZoneRead
from app.services.data_source_logger import DataSourceLogger
from app.services.provider_status import ProviderStatusRegistry

logger = logging.getLogger(__name__)


def bearing(latitude: float, longitude: float, target_latitude: float, target_longitude: float) -> tuple[float, str]:
    a, b = math.radians(latitude), math.radians(target_latitude)
    delta = math.radians(target_longitude - longitude)
    value = (math.degrees(math.atan2(math.sin(delta) * math.cos(b), math.cos(a) * math.sin(b) - math.sin(a) * math.cos(b) * math.cos(delta))) + 360) % 360
    return round(value, 1), ("N", "NE", "E", "SE", "S", "SW", "W", "NW")[int((value + 22.5) // 45) % 8]


class PFZService:
    def __init__(self, providers: list[PFZProvider], session_factory: async_sessionmaker, source_logger: DataSourceLogger, registry: ProviderStatusRegistry) -> None:
        self.providers, self.session_factory, self.source_logger, self.registry = providers, session_factory, source_logger, registry
        self.last_results: list[PFZProviderResult] = []

    async def refresh(self) -> list[PFZProviderResult]:
        async def one(provider: PFZProvider) -> PFZProviderResult:
            started = datetime.now(UTC)
            try:
                result = await provider.get_current_advisories()
                if result.advisories:
                    async with self.session_factory() as session:
                        await PFZRepository(session).upsert_many(result.advisories)
                code = None
            except ProviderError as exc:
                result, code = PFZProviderResult(provider=provider.name, status=PFZProviderAvailability.UNAVAILABLE, retrieved_at=datetime.now(UTC), message="Provider data could not be retrieved safely."), type(exc).__name__
            elapsed = (datetime.now(UTC) - started).total_seconds() * 1000
            self.registry.set_status("pfz", result.status.value, code)
            await self.source_logger.record(provider.name, "get_current_advisories", result.status.value, elapsed, code, {"advisory_count": len(result.advisories), "rejected_count": result.rejected_count})
            return result
        self.last_results = list(await asyncio.gather(*(one(provider) for provider in self.providers)))
        return self.last_results

    async def nearest(self, latitude: float, longitude: float, radius_km: float | None, limit: int) -> PFZListResponse:
        statuses = [PFZStatus.CURRENT] + ([PFZStatus.DEMO] if any(provider.name == "ORCA Demo PFZ" for provider in self.providers) else [])
        try:
            async with self.session_factory() as session:
                rows = await PFZRepository(session).nearest(latitude=latitude, longitude=longitude, statuses=statuses, radius_km=radius_km, limit=limit)
        except Exception:
            logger.warning("pfz_query_unavailable")
            rows = []
        records = [self._read(row, latitude, longitude) for row in rows]
        source_status = self.registry.snapshot()["pfz"].status.upper()
        state = "PFZ_AVAILABLE" if records else "PFZ_PROVIDER_UNAVAILABLE" if source_status in {"UNAVAILABLE", "NOT_CONNECTED"} else "NO_PFZ_WITHIN_RADIUS"
        return PFZListResponse(location=Location(latitude=latitude, longitude=longitude), status="complete" if records else "unavailable" if state == "PFZ_PROVIDER_UNAVAILABLE" else "empty", result_state=state, pfzs=records, sources=[self._source(r) for r in self.last_results], retrieved_at=datetime.now(UTC), limitations=["INCOIS WFS does not publish an explicit validity end; current means advisory date within configured freshness policy."])

    async def detail(self, pfz_id: UUID) -> PotentialFishingZoneRead | None:
        try:
            async with self.session_factory() as session:
                row = await PFZRepository(session).by_id(pfz_id)
        except Exception:
            logger.warning("pfz_detail_query_unavailable")
            return None
        return self._read(row) if row else None

    async def geojson(self) -> PFZGeoJSONResponse:
        try:
            async with self.session_factory() as session:
                statuses = [PFZStatus.CURRENT] + ([PFZStatus.DEMO] if any(provider.name == "ORCA Demo PFZ" for provider in self.providers) else [])
                rows = await PFZRepository(session).list(statuses)
        except Exception:
            rows = []
        return PFZGeoJSONResponse(features=[PFZGeoJSONFeature(id=row["PotentialFishingZone"].id, geometry=json.loads(row["geojson"]), properties={"name": row["PotentialFishingZone"].name, "status": row["PotentialFishingZone"].status.value, "provider": row["PotentialFishingZone"].provider, "advisory_date": str(row["PotentialFishingZone"].advisory_date) if row["PotentialFishingZone"].advisory_date else None}) for row in rows])

    def _read(self, row: Any, latitude: float | None = None, longitude: float | None = None) -> PotentialFishingZoneRead:
        item = row["PotentialFishingZone"]
        nearest = None
        degrees = cardinal = None
        if "nearest_latitude" in row and row["nearest_latitude"] is not None:
            nearest = Location(latitude=float(row["nearest_latitude"]), longitude=float(row["nearest_longitude"]))
            degrees, cardinal = bearing(latitude, longitude, nearest.latitude, nearest.longitude)  # type: ignore[arg-type]
        evidence = (item.metadata_ or {}).get("evidence", {"source": item.source, "retrieved_at": item.retrieved_at or item.created_at})
        return PotentialFishingZoneRead(id=item.id, external_id=item.external_id, name=item.name, geometry=json.loads(row["geojson"]), sector=item.sector, source=item.source, provider=item.provider, source_url=item.source_url, advisory_date=item.advisory_date, valid_from=item.valid_from, valid_until=item.valid_until, retrieved_at=item.retrieved_at or item.created_at, status=item.status, confidence=item.confidence, evidence=evidence, metadata={key: value for key, value in (item.metadata_ or {}).items() if key != "evidence"}, created_at=item.created_at, updated_at=item.updated_at, distance_km=float(row["distance_km"]) if row.get("distance_km") is not None else None, bearing_degrees=degrees, bearing_cardinal=cardinal, nearest_point=nearest)

    @staticmethod
    def _source(result: PFZProviderResult) -> PFZProviderSource:
        return PFZProviderSource(provider=result.provider, status=result.status, source_url=result.source_url, retrieved_at=result.retrieved_at, advisory_count=len(result.advisories), message=result.message)
