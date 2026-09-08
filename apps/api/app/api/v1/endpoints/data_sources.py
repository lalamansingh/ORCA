from fastapi import APIRouter, Request

from app.schemas.data_sources import DataSourcesResponse

router = APIRouter(prefix="/system")

@router.get("/capabilities")
async def capabilities(request: Request):
    settings = request.app.state.settings
    return {"version": settings.orca_version, "environment": settings.app_env,
            "demo_mode": settings.orca_demo_mode,
            "capabilities": {"risk": "DETERMINISTIC", "pfz_ranking": "DETERMINISTIC",
                "geofence": "REQUIRES_AUTHORITATIVE_GEOMETRY", "route": "DEMO" if settings.orca_demo_mode else "UNAVAILABLE",
                "ocean_products": "DEMO", "localization": ["en", "hi", "hi-Latn", "ta"],
                "llm": "CONFIGURED_NOT_PROBED" if settings.llm_enabled else "DISABLED",
                "conversation_storage": "POSTGRES", "graph_checkpointer": "NOT_IMPLEMENTED",
                "streaming": "NOT_IMPLEMENTED", "multi_turn_references": "NOT_IMPLEMENTED"}}


@router.get("/data-sources", response_model=DataSourcesResponse)
async def data_sources(request: Request) -> DataSourcesResponse:
    statuses = request.app.state.provider_status.snapshot()
    return DataSourcesResponse(
        weather=statuses["weather"].__dict__,
        marine=statuses["marine"].__dict__,
        alerts=[statuses[name].__dict__ for name in ("alerts_incois", "alerts_imd", "alerts_demo")],
        pfz=statuses["pfz"].__dict__,
        risk_engine=statuses["risk_engine"].__dict__,
        llm={**statuses["llm"].__dict__, "status": "disabled" if not request.app.state.settings.llm_enabled else "operational" if request.app.state.settings.llm_provider == "mock" or request.app.state.settings.openai_api_key else "not_configured"},
    )
