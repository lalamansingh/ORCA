"""Authenticated alert-subscription persistence."""

from datetime import datetime, timezone
import logging
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AlertSubscription
from app.schemas.alerts import AlertSubscriptionCreate, AlertSubscriptionUpdate

logger = logging.getLogger(__name__)

_IN_MEMORY_SUBSCRIPTIONS: dict[str, list[AlertSubscription]] = {}


class AlertSubscriptionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def for_user(self, user_id: UUID) -> list[AlertSubscription]:
        user_key = str(user_id)
        db_items: list[AlertSubscription] = []
        try:
            db_items = list((await self.session.scalars(select(AlertSubscription).where(AlertSubscription.user_id == user_id).order_by(AlertSubscription.created_at))).all())
        except Exception as exc:
            logger.warning("Error fetching subscriptions for user %s: %s", user_id, exc)
            try:
                await self.session.rollback()
            except Exception:
                pass

        if db_items:
            _IN_MEMORY_SUBSCRIPTIONS[user_key] = db_items
            return db_items

        return _IN_MEMORY_SUBSCRIPTIONS.get(user_key, [])

    async def create(self, user_id: UUID, data: AlertSubscriptionCreate) -> AlertSubscription:
        user_key = str(user_id)
        item = AlertSubscription(user_id=user_id, **data.model_dump())
        if not getattr(item, "id", None):
            item.id = uuid4()
        now = datetime.now(timezone.utc)
        if not getattr(item, "created_at", None):
            item.created_at = now
        if not getattr(item, "updated_at", None):
            item.updated_at = now

        # Add to in-memory store
        if user_key not in _IN_MEMORY_SUBSCRIPTIONS:
            _IN_MEMORY_SUBSCRIPTIONS[user_key] = []
        _IN_MEMORY_SUBSCRIPTIONS[user_key].append(item)

        try:
            self.session.add(item)
            await self.session.commit()
            await self.session.refresh(item)
        except Exception as exc:
            logger.warning("Error persisting subscription for user %s: %s", user_id, exc)
            try:
                await self.session.rollback()
            except Exception:
                pass
        return item

    async def owned(self, user_id: UUID, subscription_id: UUID) -> AlertSubscription | None:
        user_key = str(user_id)
        try:
            item = await self.session.scalar(select(AlertSubscription).where(AlertSubscription.id == subscription_id, AlertSubscription.user_id == user_id))
            if item:
                return item
        except Exception as exc:
            logger.warning("Error fetching owned subscription %s: %s", subscription_id, exc)
            try:
                await self.session.rollback()
            except Exception:
                pass

        # Fallback to in-memory
        for mem_item in _IN_MEMORY_SUBSCRIPTIONS.get(user_key, []):
            if mem_item.id == subscription_id:
                return mem_item
        return None

    async def update(self, item: AlertSubscription, data: AlertSubscriptionUpdate) -> AlertSubscription:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        item.updated_at = datetime.now(timezone.utc)
        try:
            await self.session.commit()
            await self.session.refresh(item)
        except Exception as exc:
            logger.warning("Error updating subscription %s: %s", item.id, exc)
            try:
                await self.session.rollback()
            except Exception:
                pass
        return item

    async def delete(self, item: AlertSubscription) -> None:
        user_key = str(item.user_id)
        if user_key in _IN_MEMORY_SUBSCRIPTIONS:
            _IN_MEMORY_SUBSCRIPTIONS[user_key] = [i for i in _IN_MEMORY_SUBSCRIPTIONS[user_key] if i.id != item.id]

        try:
            await self.session.delete(item)
            await self.session.commit()
        except Exception as exc:
            logger.warning("Error deleting subscription %s: %s", item.id, exc)
            try:
                await self.session.rollback()
            except Exception:
                pass


