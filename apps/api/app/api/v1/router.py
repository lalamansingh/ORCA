"""Version 1 endpoint composition."""

from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.saved_locations import router as saved_locations_router
from app.api.v1.endpoints.conditions import router as conditions_router
from app.api.v1.endpoints.data_sources import router as data_sources_router
from app.api.v1.endpoints.alerts import router as alerts_router
from app.api.v1.endpoints.alert_subscriptions import router as alert_subscriptions_router
from app.api.v1.endpoints.risk import router as risk_router
from app.api.v1.endpoints.pfz import router as pfz_router
from app.api.v1.endpoints.ocean_products import router as ocean_products_router
from app.api.v1.endpoints.ai import router as ai_router
from app.api.v1.endpoints.geofence import router as geofence_router
from app.api.v1.endpoints.routes import router as routes_router
from app.api.v1.endpoints.ais import router as ais_router

router = APIRouter()
router.include_router(health_router, tags=["system"])
router.include_router(auth_router, tags=["authentication"])
router.include_router(saved_locations_router, tags=["saved locations"])
router.include_router(conditions_router, tags=["conditions"])
router.include_router(data_sources_router, tags=["system"])
router.include_router(alerts_router, tags=["marine alerts"])
router.include_router(alert_subscriptions_router, tags=["alert subscriptions"])
router.include_router(risk_router, tags=["marine risk"])
router.include_router(pfz_router, tags=["potential fishing zones"])
router.include_router(ocean_products_router, tags=["ocean products"])
router.include_router(ai_router, tags=["AI language layer"])
router.include_router(geofence_router, tags=["maritime geofencing"])
router.include_router(routes_router, tags=["marine routes"])
router.include_router(ais_router, tags=["AIS live vessels"])
