"""PFZ proximity, detail, and GeoJSON endpoints."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel,Field
from datetime import datetime

from app.providers.factory import get_pfz_providers
from app.schemas.pfz import PFZGeoJSONResponse, PFZListResponse, PotentialFishingZoneRead
from app.services.data_source_logger import DataSourceLogger
from app.services.pfz_service import PFZService
from app.pfz_ranking.models import PFZRecommendationResult
from app.services.pfz_recommendation_service import PFZRecommendationService
from app.services.weather_service import WeatherService
from app.services.marine_weather_service import MarineWeatherService
from app.services.alert_service import AlertService
from app.services.risk_service import RiskService
from app.services.geofence_service import GeofenceService
from app.services.route_planning_service import RoutePlanningService
from app.services.ocean_product_service import OceanProductService
from app.providers.factory import get_weather_provider,get_marine_provider,get_alert_providers
from app.providers.ocean_products.demo import DemoOceanProductProvider
from app.domain.ocean_products import OceanProduct

router = APIRouter(prefix="/pfz")

class PFZRecommendationRequest(BaseModel):
    latitude:float=Field(ge=-90,le=90);longitude:float=Field(ge=-180,le=180);requested_time:datetime|None=None;radius_km:float=Field(500,gt=0,le=2000);max_results:int=Field(5,ge=1,le=10)


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

@router.post("/recommendations",response_model=PFZRecommendationResult)
async def recommend_pfz(data:PFZRecommendationRequest,request:Request)->PFZRecommendationResult:
    settings=request.app.state.settings;client=request.app.state.http_client;cache=request.app.state.forecast_cache;logger=DataSourceLogger(request.app.state.db_session_factory);registry=request.app.state.provider_status
    weather=WeatherService(get_weather_provider(settings,client),cache,settings.weather_cache_ttl,logger,registry);marine=MarineWeatherService(get_marine_provider(settings,client),cache,settings.marine_cache_ttl,logger,registry);alerts=AlertService(get_alert_providers(settings,client),cache,settings.alert_cache_ttl,request.app.state.db_session_factory,logger,registry);risk=RiskService(weather,marine,alerts,request.app.state.risk_engine,request.app.state.risk_config,request.app.state.db_session_factory);ocean=OceanProductService(DemoOceanProductProvider(),cache,900);route=RoutePlanningService(settings.orca_demo_mode,settings.route_grid_size,settings.route_max_grid_cells)
    async def risk_at(point):return (await risk.evaluate(latitude=point["latitude"],longitude=point["longitude"],assessment_time=data.requested_time,persist=False)).model_dump(mode="json")
    async def geofence_at(point):
        async with request.app.state.db_session_factory() as session:return (await GeofenceService(session,settings.geofence_boundary_caution_km).check_point(point["latitude"],point["longitude"],"FISHING",data.requested_time)).model_dump(mode="json")
    async def ocean_at(point):return (await ocean.sample(point["latitude"],point["longitude"],[OceanProduct.SEA_SURFACE_TEMPERATURE,OceanProduct.CHLOROPHYLL_A])).model_dump(mode="json")
    async def route_to(payload):return (await route.calculate(payload)).model_dump(mode="json")
    service=PFZRecommendationService(pfz_service(request),risk_at,geofence_at,route_to,ocean_at,top_n=getattr(settings,"pfz_ranking_enrich_top_n",5),concurrency=3)
    return await service.recommend({"latitude":data.latitude,"longitude":data.longitude},data.requested_time,data.radius_km,data.max_results)


@router.get("/{pfz_id}", response_model=PotentialFishingZoneRead)
async def pfz_detail(pfz_id: UUID, request: Request) -> PotentialFishingZoneRead:
    item = await pfz_service(request).detail(pfz_id)
    if not item:
        raise HTTPException(status_code=404, detail="Potential fishing zone not found.")
    return item
