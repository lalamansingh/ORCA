from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import SavedLocation

class SavedLocationRepository:
    def __init__(self, session: AsyncSession): self.session = session
    async def for_user(self, user_id: UUID) -> list[SavedLocation]:
        return list((await self.session.scalars(select(SavedLocation).where(SavedLocation.user_id == user_id))).all())
    async def for_user_location(self,user_id:UUID,location_id:UUID)->SavedLocation|None:
        return await self.session.scalar(select(SavedLocation).where(SavedLocation.user_id==user_id,SavedLocation.id==location_id))
