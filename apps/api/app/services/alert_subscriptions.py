"""Ownership checks for alert preference CRUD."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AlertSubscription, User
from app.repositories.alert_subscriptions import AlertSubscriptionRepository
from app.repositories.saved_locations import SavedLocationRepository
from app.schemas.alerts import AlertSubscriptionCreate, AlertSubscriptionUpdate


class AlertSubscriptionService:
    def __init__(self, session: AsyncSession) -> None:
        self.repository = AlertSubscriptionRepository(session)
        self.locations = SavedLocationRepository(session)

    async def list(self, user: User) -> list[AlertSubscription]:
        return await self.repository.for_user(user.id)

    async def create(self, user: User, data: AlertSubscriptionCreate) -> AlertSubscription | None:
        if data.saved_location_id and not await self.locations.for_user_location(user.id, data.saved_location_id):
            return None
        return await self.repository.create(user.id, data)

    async def update(self, user: User, subscription_id: UUID, data: AlertSubscriptionUpdate) -> AlertSubscription | None:
        item = await self.repository.owned(user.id, subscription_id)
        if not item:
            return None
        if data.saved_location_id and not await self.locations.for_user_location(user.id, data.saved_location_id):
            return None
        return await self.repository.update(item, data)

    async def delete(self, user: User, subscription_id: UUID) -> bool:
        item = await self.repository.owned(user.id, subscription_id)
        if not item:
            return False
        await self.repository.delete(item)
        return True
