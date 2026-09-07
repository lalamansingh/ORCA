"""Version 1 endpoint composition."""

from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.saved_locations import router as saved_locations_router
from app.api.v1.endpoints.conditions import router as conditions_router
from app.api.v1.endpoints.data_sources import router as data_sources_router

router = APIRouter()
router.include_router(health_router, tags=["system"])
router.include_router(auth_router, tags=["authentication"])
router.include_router(saved_locations_router, tags=["saved locations"])
router.include_router(conditions_router, tags=["conditions"])
router.include_router(data_sources_router, tags=["system"])
