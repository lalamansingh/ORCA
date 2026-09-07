"""Authenticated alert-subscription persistence."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AlertSubscription
from app.schemas.alerts import AlertSubscriptionCreate, AlertSubscriptionUpdate


class AlertSubscriptionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def for_user(self, user_id: UUID) -> list[AlertSubscription]:
        return list((await self.session.scalars(select(AlertSubscription).where(AlertSubscription.user_id == user_id).order_by(AlertSubscription.created_at))).all())

    async def create(self, user_id: UUID, data: AlertSubscriptionCreate) -> AlertSubscription:
        item = AlertSubscription(user_id=user_id, **data.model_dump())
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def owned(self, user_id: UUID, subscription_id: UUID) -> AlertSubscription | None:
        return await self.session.scalar(select(AlertSubscription).where(AlertSubscription.id == subscription_id, AlertSubscription.user_id == user_id))

    async def update(self, item: AlertSubscription, data: AlertSubscriptionUpdate) -> AlertSubscription:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def delete(self, item: AlertSubscription) -> None:
        await self.session.delete(item)
        await self.session.commit()
