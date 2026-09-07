from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import csrf_protect, get_current_user
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.persistence import SavedLocationCreate, SavedLocationRead
from app.services.saved_locations import SavedLocationService
router=APIRouter(prefix="/saved-locations")
@router.get("",response_model=list[SavedLocationRead])
async def list_locations(user:User=Depends(get_current_user),session:AsyncSession=Depends(get_db_session)): return await SavedLocationService(session).list_for_user(user)
@router.post("",response_model=SavedLocationRead,status_code=status.HTTP_201_CREATED,dependencies=[Depends(csrf_protect)])
async def create_location(data:SavedLocationCreate,user:User=Depends(get_current_user),session:AsyncSession=Depends(get_db_session)): return await SavedLocationService(session).create(user,data)
@router.patch("/{location_id}",response_model=SavedLocationRead,dependencies=[Depends(csrf_protect)])
async def update_location(location_id:UUID,data:SavedLocationCreate,user:User=Depends(get_current_user),session:AsyncSession=Depends(get_db_session)):
    item=await SavedLocationService(session).update(user,location_id,data)
    if not item:raise HTTPException(status_code=404,detail="Saved location not found.")
    return item
@router.delete("/{location_id}",status_code=status.HTTP_204_NO_CONTENT,dependencies=[Depends(csrf_protect)])
async def delete_location(location_id:UUID,user:User=Depends(get_current_user),session:AsyncSession=Depends(get_db_session)):
    if not await SavedLocationService(session).delete(user,location_id):raise HTTPException(status_code=404,detail="Saved location not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
