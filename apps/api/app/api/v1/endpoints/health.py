"""Service-health endpoints."""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.schemas.health import DatabaseDependencyResponse, DependenciesResponse, HealthResponse, ProviderDependencyResponse
from app.services.database_health import check_database_health

router = APIRouter()

@router.get("/health/live")
async def liveness()->dict[str,str]:return {"status":"alive","service":"orca-api"}

@router.get("/health/ready")
async def readiness(request:Request)->dict[str,object]:
    database=await check_database_health(request.app.state.db_engine)
    ready = database.status == "healthy" and database.postgis is True
    return JSONResponse({"status":"ready" if ready else "not_ready","database":database.status,"postgis":database.postgis}, status_code=200 if ready else 503)


@router.get("/health", response_model=HealthResponse, summary="Get API health")
async def health_check(request: Request) -> HealthResponse:
    settings = request.app.state.settings
    database = await check_database_health(request.app.state.db_engine)
    providers = request.app.state.provider_status.snapshot()
    return HealthResponse(
        status="healthy" if database.status == "healthy" else "degraded",
        service="orca-api",
        version=settings.orca_version,
        environment=settings.app_env,
        dependencies=DependenciesResponse(
            database=DatabaseDependencyResponse(status=database.status, postgis=database.postgis),
            weather_provider=ProviderDependencyResponse(status=providers["weather"].status, last_success=providers["weather"].last_success.isoformat() if providers["weather"].last_success else None),
            marine_provider=ProviderDependencyResponse(status=providers["marine"].status, last_success=providers["marine"].last_success.isoformat() if providers["marine"].last_success else None),
        ),
    )
