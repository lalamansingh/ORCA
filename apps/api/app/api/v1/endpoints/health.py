"""Service-health endpoints."""

from fastapi import APIRouter, Request

from app.schemas.health import DatabaseDependencyResponse, DependenciesResponse, HealthResponse, ProviderDependencyResponse
from app.services.database_health import check_database_health

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Get API health")
async def health_check(request: Request) -> HealthResponse:
    settings = request.app.state.settings
    database = await check_database_health(request.app.state.db_engine)
    providers = request.app.state.provider_status.snapshot()
    return HealthResponse(
        status="healthy" if database.status == "healthy" else "degraded",
        service="orca-api",
        version="0.1.0",
        environment=settings.app_env,
        dependencies=DependenciesResponse(
            database=DatabaseDependencyResponse(status=database.status, postgis=database.postgis),
            weather_provider=ProviderDependencyResponse(status=providers["weather"].status, last_success=providers["weather"].last_success.isoformat() if providers["weather"].last_success else None),
            marine_provider=ProviderDependencyResponse(status=providers["marine"].status, last_success=providers["marine"].last_success.isoformat() if providers["marine"].last_success else None),
        ),
    )
