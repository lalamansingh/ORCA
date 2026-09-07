from uuid import UUID
from geoalchemy2.elements import WKTElement
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import SavedLocation, User
from app.repositories.saved_locations import SavedLocationRepository
from app.schemas.persistence import SavedLocationCreate

class SavedLocationService:
    def __init__(self,session:AsyncSession): self.session=session; self.repository=SavedLocationRepository(session)
    async def list_for_user(self,user:User)->list[SavedLocation]: return await self.repository.for_user(user.id)
    async def create(self,user:User,data:SavedLocationCreate)->SavedLocation:
        item=SavedLocation(user_id=user.id,name=data.name,location_type=data.location_type,latitude=data.latitude,longitude=data.longitude,geometry=WKTElement(f"POINT({data.longitude} {data.latitude})",srid=4326));self.session.add(item);await self.session.commit();await self.session.refresh(item);return item
    async def update(self,user:User,location_id:UUID,data:SavedLocationCreate)->SavedLocation|None:
        item=await self.repository.for_user_location(user.id,location_id)
        if not item:return None
        item.name,item.location_type,item.latitude,item.longitude=data.name,data.location_type,data.latitude,data.longitude
        item.geometry=WKTElement(f"POINT({data.longitude} {data.latitude})",srid=4326);await self.session.commit();await self.session.refresh(item);return item
    async def delete(self,user:User,location_id:UUID)->bool:
        item=await self.repository.for_user_location(user.id,location_id)
        if not item:return False
        await self.session.delete(item);await self.session.commit();return True
