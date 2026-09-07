from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Request

from app.providers.errors import DataUnavailableError, ProviderError, ProviderTimeoutError
from app.providers.factory import get_marine_provider, get_weather_provider
from app.schemas.conditions import CombinedConditionsResponse
from app.schemas.marine import MarineResponse
from app.schemas.weather import WeatherResponse
from app.services.combined_conditions_service import CombinedConditionsService
from app.services.data_source_logger import DataSourceLogger
from app.services.marine_weather_service import MarineWeatherService
from app.services.weather_service import WeatherService

router = APIRouter()


def services(request: Request) -> tuple[WeatherService, MarineWeatherService]:
    settings = request.app.state.settings
    logger = DataSourceLogger(request.app.state.db_session_factory)
    try:
        weather_provider = get_weather_provider(settings, request.app.state.http_client)
        marine_provider = get_marine_provider(settings, request.app.state.http_client)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail="Forecast provider configuration is invalid.") from exc
    return (
        WeatherService(weather_provider, request.app.state.forecast_cache, settings.weather_cache_ttl, logger, request.app.state.provider_status),
        MarineWeatherService(marine_provider, request.app.state.forecast_cache, settings.marine_cache_ttl, logger, request.app.state.provider_status),
    )


@router.get("/weather", response_model=WeatherResponse)
async def weather(request: Request, latitude: float = Query(ge=-90, le=90), longitude: float = Query(ge=-180, le=180), date: datetime | None = None, timezone: str = Query(default="auto", max_length=64), refresh: bool = False) -> WeatherResponse:
    weather_service, _ = services(request)
    try:
        return await weather_service.get_conditions(latitude, longitude, timezone, date, refresh)
    except ProviderError as exc:
        raise provider_http_error(exc) from exc


@router.get("/marine", response_model=MarineResponse)
async def marine(request: Request, latitude: float = Query(ge=-90, le=90), longitude: float = Query(ge=-180, le=180), date: datetime | None = None, timezone: str = Query(default="auto", max_length=64), refresh: bool = False) -> MarineResponse:
    _, marine_service = services(request)
    try:
        return await marine_service.get_conditions(latitude, longitude, timezone, date, refresh)
    except ProviderError as exc:
        raise provider_http_error(exc) from exc


@router.get("/conditions", response_model=CombinedConditionsResponse)
async def combined(request: Request, latitude: float = Query(ge=-90, le=90), longitude: float = Query(ge=-180, le=180), timezone: str = Query(default="auto", max_length=64), refresh: bool = False) -> CombinedConditionsResponse:
    weather_service, marine_service = services(request)
    return await CombinedConditionsService(weather_service, marine_service).get_conditions(latitude, longitude, timezone, refresh)


def provider_http_error(error: ProviderError) -> HTTPException:
    if isinstance(error, DataUnavailableError):
        return HTTPException(status_code=404, detail=str(error))
    if isinstance(error, ProviderTimeoutError):
        return HTTPException(status_code=504, detail="Forecast provider timed out.")
    return HTTPException(status_code=503, detail=str(error))
