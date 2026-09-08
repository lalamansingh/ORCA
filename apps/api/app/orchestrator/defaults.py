"""Adapters from fixed planner tools to existing deterministic services."""
from typing import Any
from app.providers.factory import get_alert_providers,get_marine_provider,get_weather_provider
from app.providers.ocean_products.demo import DemoOceanProductProvider
from app.providers.factory import get_pfz_providers
from app.services.alert_service import AlertService
from app.services.data_source_logger import DataSourceLogger
from app.services.forecast_cache import TTLCache
from app.services.marine_weather_service import MarineWeatherService
from app.services.ocean_product_service import OceanProductService
from app.services.pfz_service import PFZService
from app.services.provider_status import ProviderStatusRegistry
from app.services.weather_service import WeatherService
from app.services.risk_service import RiskService
from app.services.geofence_service import GeofenceService
from app.services.route_planning_service import RoutePlanningService
from app.routing.models import RouteRequest
from app.services.pfz_recommendation_service import PFZRecommendationService
from app.domain.ocean_products import OceanProduct
from app.planner.models import PlannerTool
from app.orchestrator.registry import ORCAToolRegistry


def build_default_registry(request:Any)->ORCAToolRegistry:
    settings=request.app.state.settings;client=request.app.state.http_client;cache=request.app.state.forecast_cache;logger=DataSourceLogger(request.app.state.db_session_factory);registry=request.app.state.provider_status
    weather=WeatherService(get_weather_provider(settings,client),cache,settings.weather_cache_ttl,logger,registry)
    marine=MarineWeatherService(get_marine_provider(settings,client),cache,settings.marine_cache_ttl,logger,registry)
    alerts=AlertService(get_alert_providers(settings,client),cache,settings.alert_cache_ttl,request.app.state.db_session_factory,logger,registry)
    pfz=PFZService(get_pfz_providers(settings,client),request.app.state.db_session_factory,logger,registry)
    ocean=OceanProductService(DemoOceanProductProvider(),cache,900)
    risk=RiskService(weather,marine,alerts,request.app.state.risk_engine,request.app.state.risk_config,request.app.state.db_session_factory)
    async def location(inputs:dict[str,Any])->tuple[float,float]:
        item=inputs.get("location") or inputs.get("target") or {};return float(item["latitude"]),float(item["longitude"])
    async def weather_adapter(step,inputs,steps):
        lat,lon=await location(inputs);return (await weather.get_conditions(lat,lon,target_time=None)).model_dump(mode="json")
    async def marine_adapter(step,inputs,steps):
        lat,lon=await location(inputs);return (await marine.get_conditions(lat,lon,target_time=None)).model_dump(mode="json")
    async def alert_adapter(step,inputs,steps):
        lat,lon=await location(inputs);return (await alerts.list_alerts(latitude=lat,longitude=lon,active_only=True)).model_dump(mode="json")
    async def pfz_adapter(step,inputs,steps):
        lat,lon=await location(inputs);return (await pfz.nearest(lat,lon,500,5)).model_dump(mode="json")
    async def geo_adapter(step,inputs,steps):
        return {"target":inputs.get("target_ref") or inputs.get("location"),"operation":step.operation}
    async def ocean_adapter(step,inputs,steps):
        lat,lon=await location(inputs);return (await ocean.sample(lat,lon,[OceanProduct.SEA_SURFACE_TEMPERATURE,OceanProduct.CHLOROPHYLL_A])).model_dump(mode="json")
    async def risk_adapter(step,inputs,steps):
        lat,lon=await location(inputs)
        return (await risk.evaluate(latitude=lat,longitude=lon,persist=False)).model_dump(mode="json")
    async def geofence_adapter(step,inputs,steps):
        lat,lon=await location(inputs)
        async with request.app.state.db_session_factory() as session:
            return (await GeofenceService(session,getattr(settings,"geofence_boundary_caution_km",5)).check_point(lat,lon)).model_dump(mode="json")
    async def route_adapter(step,inputs,steps):
        payload=RouteRequest(start=inputs["start"],destination=inputs["destination"],departure_time=None)
        return (await RoutePlanningService(settings.orca_demo_mode,settings.route_grid_size,settings.route_max_grid_cells).calculate(payload)).model_dump(mode="json")
    async def recommendation_adapter(step,inputs,steps):
        lat,lon=await location(inputs);origin={"latitude":lat,"longitude":lon};route_service=RoutePlanningService(settings.orca_demo_mode,settings.route_grid_size,settings.route_max_grid_cells)
        async def risk_at(point):return (await risk.evaluate(latitude=point["latitude"],longitude=point["longitude"],persist=False)).model_dump(mode="json")
        async def geofence_at(point):
            async with request.app.state.db_session_factory() as session:return (await GeofenceService(session,settings.geofence_boundary_caution_km).check_point(point["latitude"],point["longitude"],"FISHING")).model_dump(mode="json")
        async def route_to(payload):return (await route_service.calculate(payload)).model_dump(mode="json")
        async def ocean_at(point):return (await ocean.sample(point["latitude"],point["longitude"],[OceanProduct.SEA_SURFACE_TEMPERATURE,OceanProduct.CHLOROPHYLL_A])).model_dump(mode="json")
        service=PFZRecommendationService(pfz,risk_at,geofence_at,route_to,ocean_at,top_n=settings.pfz_ranking_enrich_top_n)
        return (await service.recommend(origin)).model_dump(mode="json")
    async def map_adapter(step,inputs,steps):return {"action":"SHOW_LAYER","layer":"pfz"}
    return ORCAToolRegistry({PlannerTool.WEATHER:weather_adapter,PlannerTool.MARINE:marine_adapter,PlannerTool.ALERTS:alert_adapter,PlannerTool.PFZ:pfz_adapter,PlannerTool.PFZ_RECOMMENDATION:recommendation_adapter,PlannerTool.GEOSPATIAL:geo_adapter,PlannerTool.GEOFENCE:geofence_adapter,PlannerTool.ROUTE:route_adapter,PlannerTool.OCEAN_PRODUCTS:ocean_adapter,PlannerTool.RISK:risk_adapter,PlannerTool.MAP:map_adapter})
