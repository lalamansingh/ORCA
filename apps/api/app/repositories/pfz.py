"""PostGIS persistence and closest-geometry queries for PFZ advisories."""

from __future__ import annotations

import json
from typing import Any, Sequence
from uuid import UUID

from geoalchemy2 import Geography
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PotentialFishingZone
from app.domain.pfz import PFZStatus
from app.schemas.pfz import NormalizedPotentialFishingZone


def _point(longitude: float, latitude: float):
    return func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326)


def _geometry(value: dict[str, object]):
    return func.ST_SetSRID(func.ST_GeomFromGeoJSON(json.dumps(value)), 4326)


class PFZRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_many(self, advisories: list[NormalizedPotentialFishingZone]) -> None:
        for item in advisories:
            record = await self.session.scalar(select(PotentialFishingZone).where(PotentialFishingZone.provider == item.provider, PotentialFishingZone.external_id == item.external_id))
            geometry = _geometry(item.geometry.model_dump())
            fields: dict[str, Any] = {"name": item.name, "geometry": geometry, "centroid": func.ST_Centroid(geometry), "source": item.source, "source_url": str(item.source_url) if item.source_url else None, "sector": item.sector, "status": item.status, "advisory_date": item.advisory_date, "valid_from": item.valid_from, "valid_until": item.valid_until, "retrieved_at": item.retrieved_at, "confidence": item.confidence, "metadata_": {**item.metadata, "evidence": item.evidence.model_dump(mode="json")}}
            if record is None:
                self.session.add(PotentialFishingZone(provider=item.provider, external_id=item.external_id, **fields))
            else:
                for name, value in fields.items():
                    setattr(record, name, value)
        await self.session.commit()

    async def list(self, statuses: Sequence[PFZStatus], limit: int = 500) -> list[dict[str, Any]]:
        statement = select(PotentialFishingZone, func.ST_AsGeoJSON(PotentialFishingZone.geometry).label("geojson")).where(PotentialFishingZone.status.in_(statuses)).order_by(PotentialFishingZone.advisory_date.desc().nullslast(), PotentialFishingZone.name).limit(limit)
        return list((await self.session.execute(statement)).mappings().all())

    async def by_id(self, pfz_id: UUID) -> dict[str, Any] | None:
        statement = select(PotentialFishingZone, func.ST_AsGeoJSON(PotentialFishingZone.geometry).label("geojson")).where(PotentialFishingZone.id == pfz_id)
        return (await self.session.execute(statement)).mappings().first()

    async def nearest(self, *, latitude: float, longitude: float, statuses: Sequence[PFZStatus], radius_km: float | None, limit: int) -> list[dict[str, Any]]:
        point = _point(longitude, latitude)
        distance_m = func.ST_Distance(PotentialFishingZone.geometry.cast(Geography), point.cast(Geography))
        nearest = func.ST_ClosestPoint(PotentialFishingZone.geometry, point)
        statement = select(PotentialFishingZone, func.ST_AsGeoJSON(PotentialFishingZone.geometry).label("geojson"), (distance_m / 1000).label("distance_km"), func.ST_X(nearest).label("nearest_longitude"), func.ST_Y(nearest).label("nearest_latitude")).where(PotentialFishingZone.status.in_(statuses))
        if radius_km is not None:
            statement = statement.where(func.ST_DWithin(PotentialFishingZone.geometry.cast(Geography), point.cast(Geography), radius_km * 1000))
        return list((await self.session.execute(statement.order_by(distance_m).limit(limit))).mappings().all())
