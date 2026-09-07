"""PostGIS-backed alert ingestion and location-aware queries."""

import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from geoalchemy2 import Geography, WKTElement
from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MarineAlert
from app.domain.alerts import AlertSeverity, AlertSourceType, AlertStatus, AlertType
from app.schemas.alerts import AlertEvidence, CycloneDetails, MarineAlertRead, NormalizedMarineAlert
from app.schemas.evidence import Location


def _point(longitude: float, latitude: float):  # type: ignore[no-untyped-def]
    return func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326)


def _wkt(geometry: Any | None) -> WKTElement | None:
    if geometry is None:
        return None
    data = geometry.model_dump() if hasattr(geometry, "model_dump") else geometry
    kind, coordinates = data["type"], data["coordinates"]
    pair = lambda value: f"{float(value[0])} {float(value[1])}"
    if kind == "Point":
        text = f"POINT({pair(coordinates)})"
    elif kind == "LineString":
        text = f"LINESTRING({','.join(pair(item) for item in coordinates)})"
    elif kind == "Polygon":
        rings = [f"({','.join(pair(item) for item in ring)})" for ring in coordinates]
        text = f"POLYGON({','.join(rings)})"
    elif kind == "MultiPolygon":
        polygons = [f"({','.join(f'({','.join(pair(item) for item in ring)})' for ring in polygon)})" for polygon in coordinates]
        text = f"MULTIPOLYGON({','.join(polygons)})"
    else:
        raise ValueError("Unsupported alert geometry.")
    return WKTElement(text, srid=4326)


class AlertRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_many(self, alerts: list[NormalizedMarineAlert]) -> int:
        for alert in alerts:
            values = {
                "external_id": alert.external_id,
                "alert_type": alert.type,
                "severity": alert.severity,
                "status": alert.status,
                "source_type": alert.source_type,
                "title": alert.title,
                "summary": alert.summary,
                "description": alert.description,
                "affected_area": alert.affected_area,
                "geometry": _wkt(alert.geometry),
                "latitude": alert.latitude,
                "longitude": alert.longitude,
                "radius_km": alert.radius_km,
                "forecast_track": _wkt(alert.forecast_track),
                "forecast_points": [point.model_dump(mode="json") for point in alert.forecast_points] or None,
                "source": alert.source,
                "provider": alert.provider,
                "source_url": str(alert.source_url) if alert.source_url else None,
                "instructions": alert.instructions or None,
                "valid_from": alert.valid_from,
                "valid_until": alert.valid_until,
                "issued_at": alert.issued_at,
                "observed_at": None,
                "retrieved_at": alert.retrieved_at,
                "metadata": {**alert.metadata, **({"cyclone": alert.cyclone.model_dump()} if alert.cyclone else {})},
            }
            table = MarineAlert.__table__
            statement = insert(table).values(**values)
            updates = {table.c[key]: getattr(statement.excluded, key) for key in values if key not in {"provider", "external_id"}}
            updates[table.c.updated_at] = func.now()
            await self.session.execute(
                statement.on_conflict_do_update(
                    index_elements=[table.c.provider, table.c.external_id],
                    set_=updates,
                )
            )
        await self.session.commit()
        return len(alerts)

    def _query(
        self,
        *,
        latitude: float | None,
        longitude: float | None,
        radius_km: float | None,
        status: AlertStatus | None,
        alert_type: AlertType | None,
        severity: AlertSeverity | None,
        start_time: datetime | None,
        end_time: datetime | None,
        alert_id: UUID | None = None,
        include_demo: bool = False,
    ):
        point = _point(longitude, latitude) if latitude is not None and longitude is not None else None
        distance = func.ST_Distance(MarineAlert.geometry.cast(Geography), point.cast(Geography)) / 1000 if point is not None else None
        inside = case(
            (MarineAlert.radius_km.is_not(None), func.ST_DWithin(MarineAlert.geometry.cast(Geography), point.cast(Geography), MarineAlert.radius_km * 1000)),
            else_=func.ST_Covers(MarineAlert.geometry, point),
        ) if point is not None else None
        nearest = func.ST_AsGeoJSON(func.ST_ClosestPoint(MarineAlert.geometry, point)) if point is not None else None
        columns = [MarineAlert, func.ST_AsGeoJSON(MarineAlert.geometry).label("geometry_json"), func.ST_AsGeoJSON(MarineAlert.forecast_track).label("track_json")]
        columns.extend([distance.label("distance_km"), inside.label("is_inside"), nearest.label("nearest_json")] if point is not None else [func.null().label("distance_km"), func.null().label("is_inside"), func.null().label("nearest_json")])
        query = select(*columns)
        filters = []
        if not include_demo:
            filters.append(MarineAlert.source_type != AlertSourceType.DEMO)
        if alert_id:
            filters.append(MarineAlert.id == alert_id)
        if status:
            filters.append(MarineAlert.status == status)
        if alert_type:
            filters.append(MarineAlert.alert_type == alert_type)
        if severity:
            filters.append(MarineAlert.severity == severity)
        if start_time:
            filters.append(or_(MarineAlert.valid_until.is_(None), MarineAlert.valid_until >= start_time))
        if end_time:
            filters.append(or_(MarineAlert.valid_from.is_(None), MarineAlert.valid_from <= end_time))
        if point is not None and radius_km is not None:
            filters.append(or_(MarineAlert.geometry.is_(None), func.ST_DWithin(MarineAlert.geometry.cast(Geography), point.cast(Geography), (radius_km + func.coalesce(MarineAlert.radius_km, 0)) * 1000)))
        if filters:
            query = query.where(and_(*filters))
        ordering = [distance.asc().nullslast()] if distance is not None else []
        return query.order_by(*ordering, MarineAlert.issued_at.desc().nullslast(), MarineAlert.updated_at.desc()).limit(500)

    async def list_filtered(self, **filters) -> list[MarineAlertRead]:  # type: ignore[no-untyped-def]
        rows = (await self.session.execute(self._query(**filters))).all()
        return [_read(*row) for row in rows]

    async def by_id(self, alert_id: UUID, latitude: float | None = None, longitude: float | None = None, include_demo: bool = False) -> MarineAlertRead | None:
        query = self._query(latitude=latitude, longitude=longitude, radius_km=None, status=None, alert_type=None, severity=None, start_time=None, end_time=None, alert_id=alert_id, include_demo=include_demo)
        row = (await self.session.execute(query)).first()
        return _read(*row) if row else None


def _read(item: MarineAlert, geometry_json: str | None, track_json: str | None, distance_km: float | None, is_inside: bool | None, nearest_json: str | None) -> MarineAlertRead:
    geometry = json.loads(geometry_json) if geometry_json else None
    track = json.loads(track_json) if track_json else None
    nearest_data = json.loads(nearest_json) if nearest_json else None
    nearest = Location(latitude=nearest_data["coordinates"][1], longitude=nearest_data["coordinates"][0]) if nearest_data else None
    metadata = item.metadata_ or {}
    cyclone = CycloneDetails.model_validate(metadata["cyclone"]) if metadata.get("cyclone") else None
    evidence = AlertEvidence(source=item.source, bulletin=item.summary or item.title, issued_at=item.issued_at, valid_from=item.valid_from, valid_until=item.valid_until, retrieved_at=item.retrieved_at or item.updated_at, provider_url=item.source_url)
    return MarineAlertRead(
        id=item.id, created_at=item.created_at, external_id=item.external_id, type=item.alert_type, severity=item.severity, title=item.title,
        summary=item.summary, description=item.description, affected_area=item.affected_area, geometry=geometry,
        latitude=item.latitude, longitude=item.longitude, radius_km=item.radius_km, forecast_track=track,
        forecast_points=item.forecast_points or [], valid_from=item.valid_from, valid_until=item.valid_until,
        issued_at=item.issued_at, updated_at=item.updated_at, retrieved_at=item.retrieved_at or item.updated_at,
        source=item.source, source_url=item.source_url, provider=item.provider, status=item.status,
        source_type=item.source_type, instructions=item.instructions or [], evidence=evidence, metadata=metadata,
        cyclone=cyclone, distance_km=round(float(distance_km), 2) if distance_km is not None else None,
        is_inside=is_inside, nearest_point=nearest, freshness="UNKNOWN",
    )
