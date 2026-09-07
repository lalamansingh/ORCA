from fastapi import APIRouter, Request

from app.schemas.data_sources import DataSourcesResponse

router = APIRouter(prefix="/system")


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
