"""Public, location-aware marine alert endpoints."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request

from app.domain.alerts import AlertSeverity, AlertStatus, AlertType
from app.providers.factory import get_alert_providers
from app.schemas.alerts import AlertListResponse, MarineAlertRead
from app.services.alert_service import AlertService
from app.services.data_source_logger import DataSourceLogger

router = APIRouter(prefix="/alerts")


def alert_service(request: Request) -> AlertService:
    settings = request.app.state.settings
    try:
        providers = get_alert_providers(settings, request.app.state.http_client)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail="Alert provider configuration is invalid.") from exc
    return AlertService(providers, request.app.state.forecast_cache, settings.alert_cache_ttl, request.app.state.db_session_factory, DataSourceLogger(request.app.state.db_session_factory), request.app.state.provider_status)


@router.get("", response_model=AlertListResponse)
async def list_alerts(
    request: Request,
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    radius_km: float | None = Query(default=100, gt=0, le=2000),
    status: AlertStatus | None = None,
    type: AlertType | None = None,
    severity: AlertSeverity | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    refresh: bool = False,
) -> AlertListResponse:
    return await alert_service(request).list_alerts(latitude=latitude, longitude=longitude, radius_km=radius_km, status=status, alert_type=type, severity=severity, start_time=start_time, end_time=end_time, refresh=refresh)


@router.get("/active", response_model=AlertListResponse)
async def active_alerts(
    request: Request,
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    radius_km: float | None = Query(default=100, gt=0, le=2000),
    type: AlertType | None = None,
    severity: AlertSeverity | None = None,
    refresh: bool = False,
) -> AlertListResponse:
    return await alert_service(request).list_alerts(latitude=latitude, longitude=longitude, radius_km=radius_km, alert_type=type, severity=severity, active_only=True, refresh=refresh)


@router.get("/{alert_id}", response_model=MarineAlertRead)
async def alert_detail(
    alert_id: UUID,
    request: Request,
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
) -> MarineAlertRead:
    if (latitude is None) != (longitude is None):
        raise HTTPException(status_code=422, detail="Latitude and longitude must be provided together.")
    item = await alert_service(request).detail(alert_id, latitude, longitude)
    if not item:
        raise HTTPException(status_code=404, detail="Marine alert not found.")
    return item
