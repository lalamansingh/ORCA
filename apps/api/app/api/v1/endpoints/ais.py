from fastapi import APIRouter, Query
from app.services.ais_service import AISService, AISResponse

router = APIRouter(prefix="/ais", tags=["ais"])
_service = AISService()

@router.get("/vessels", response_model=AISResponse)
async def get_live_vessels(
    latitude: float = Query(13.08, ge=-90, le=90),
    longitude: float = Query(80.27, ge=-180, le=180),
    radius_km: float = Query(150.0, ge=1, le=500),
) -> AISResponse:
    """Return live AIS vessel positions and maritime traffic surrounding the query location."""
    return _service.get_vessels(latitude, longitude, radius_km)
