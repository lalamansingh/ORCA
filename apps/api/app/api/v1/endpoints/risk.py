"""Deterministic marine operational risk endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.dependencies import csrf_protect, get_current_user
from app.db.models import User
from app.providers.factory import get_alert_providers, get_marine_provider, get_weather_provider
from app.risk.models import MarineRiskAssessment, RiskAssessmentRecordRead, RiskEvaluationRequest, RiskTimelineResponse
from app.services.alert_service import AlertService
from app.services.data_source_logger import DataSourceLogger
from app.services.marine_weather_service import MarineWeatherService
from app.services.risk_service import RiskRequestError, RiskService
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/risk")


def risk_service(request: Request) -> RiskService:
    settings = request.app.state.settings
    logger = DataSourceLogger(request.app.state.db_session_factory)
    weather = WeatherService(get_weather_provider(settings, request.app.state.http_client), request.app.state.forecast_cache, settings.weather_cache_ttl, logger, request.app.state.provider_status)
    marine = MarineWeatherService(get_marine_provider(settings, request.app.state.http_client), request.app.state.forecast_cache, settings.marine_cache_ttl, logger, request.app.state.provider_status)
    alerts = AlertService(get_alert_providers(settings, request.app.state.http_client), request.app.state.forecast_cache, settings.alert_cache_ttl, request.app.state.db_session_factory, logger, request.app.state.provider_status)
    return RiskService(weather, marine, alerts, request.app.state.risk_engine, request.app.state.risk_config, request.app.state.db_session_factory)


@router.post("/evaluate", response_model=MarineRiskAssessment, dependencies=[Depends(csrf_protect)])
async def evaluate_risk(data: RiskEvaluationRequest, request: Request, user: User = Depends(get_current_user)) -> MarineRiskAssessment:
    try:
        return await risk_service(request).evaluate(
            latitude=data.latitude, longitude=data.longitude, assessment_time=data.assessment_time,
            refresh=data.refresh, persist=data.persist, user_id=user.id,
        )
    except RiskRequestError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("", response_model=MarineRiskAssessment)
async def quick_risk(
    request: Request, latitude: float = Query(ge=-90, le=90), longitude: float = Query(ge=-180, le=180),
    assessment_time: datetime | None = None, refresh: bool = False,
) -> MarineRiskAssessment:
    try:
        return await risk_service(request).evaluate(latitude=latitude, longitude=longitude, assessment_time=assessment_time, refresh=refresh)
    except RiskRequestError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/timeline", response_model=RiskTimelineResponse)
async def risk_timeline(
    request: Request, latitude: float = Query(ge=-90, le=90), longitude: float = Query(ge=-180, le=180),
    hours: int = Query(default=24, ge=1, le=48), interval_hours: int = Query(default=3, ge=1, le=12), refresh: bool = False,
) -> RiskTimelineResponse:
    try:
        return await risk_service(request).timeline(latitude=latitude, longitude=longitude, hours=hours, interval_hours=interval_hours, refresh=refresh)
    except RiskRequestError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/history", response_model=list[RiskAssessmentRecordRead])
async def risk_history(request: Request, limit: int = Query(default=20, ge=1, le=100), user: User = Depends(get_current_user)) -> list[RiskAssessmentRecordRead]:
    from app.repositories.risk_assessments import RiskAssessmentRepository
    async with request.app.state.db_session_factory() as session:
        records = await RiskAssessmentRepository(session).list_for_user(user.id, limit)
    return [RiskAssessmentRecordRead.model_validate(record, from_attributes=True) for record in records]
