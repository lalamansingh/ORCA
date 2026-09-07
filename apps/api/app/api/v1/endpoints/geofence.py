from fastapi import APIRouter,Depends,Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db_session
from app.schemas.geofence import GeofenceAssessment,GeofenceCheckRequest,ZoneSummary
from app.services.geofence_service import GeofenceService

router=APIRouter(prefix="/geofence")
@router.post("/check",response_model=GeofenceAssessment)
async def check(data:GeofenceCheckRequest,session:AsyncSession=Depends(get_db_session)):
    return await GeofenceService(session).check_point(data.latitude,data.longitude,data.activity,data.assessment_time,data.radius_km)
@router.get("/nearby",response_model=list[ZoneSummary])
async def nearby(latitude:float=Query(ge=-90,le=90),longitude:float=Query(ge=-180,le=180),radius_km:float=Query(10,gt=0,le=500),session:AsyncSession=Depends(get_db_session)):
    result=await GeofenceService(session).check_point(latitude,longitude,radius_km=radius_km);return result.inside_zones+result.nearby_zones
