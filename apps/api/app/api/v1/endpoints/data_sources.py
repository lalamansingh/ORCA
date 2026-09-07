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
    )
