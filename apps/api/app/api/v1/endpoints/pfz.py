"""PFZ proximity, detail, and GeoJSON endpoints."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request

from app.providers.factory import get_pfz_providers
from app.schemas.pfz import PFZGeoJSONResponse, PFZListResponse, PotentialFishingZoneRead
from app.services.data_source_logger import DataSourceLogger
from app.services.pfz_service import PFZService

router = APIRouter(prefix="/pfz")


def pfz_service(request: Request) -> PFZService:
    try:
        providers = get_pfz_providers(request.app.state.settings, request.app.state.http_client)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail="PFZ provider configuration is invalid.") from exc
    return PFZService(providers, request.app.state.db_session_factory, DataSourceLogger(request.app.state.db_session_factory), request.app.state.provider_status)


@router.get("/nearest", response_model=PFZListResponse)
async def nearest_pfz(request: Request, latitude: float = Query(ge=-90, le=90), longitude: float = Query(ge=-180, le=180), radius_km: float | None = Query(default=500, gt=0, le=2000), limit: int = Query(default=5, ge=1, le=25)) -> PFZListResponse:
    return await pfz_service(request).nearest(latitude, longitude, radius_km, limit)


@router.get("/geojson", response_model=PFZGeoJSONResponse)
async def pfz_geojson(request: Request) -> PFZGeoJSONResponse:
    return await pfz_service(request).geojson()


@router.get("/{pfz_id}", response_model=PotentialFishingZoneRead)
async def pfz_detail(pfz_id: UUID, request: Request) -> PotentialFishingZoneRead:
    item = await pfz_service(request).detail(pfz_id)
    if not item:
        raise HTTPException(status_code=404, detail="Potential fishing zone not found.")
    return item
