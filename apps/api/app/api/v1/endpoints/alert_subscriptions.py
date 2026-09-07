"""Authenticated alert preference CRUD; delivery is intentionally out of scope."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import csrf_protect, get_current_user
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.alerts import AlertSubscriptionCreate, AlertSubscriptionRead, AlertSubscriptionUpdate
from app.services.alert_subscriptions import AlertSubscriptionService

router = APIRouter(prefix="/alert-subscriptions")


@router.get("", response_model=list[AlertSubscriptionRead])
async def subscriptions(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    return await AlertSubscriptionService(session).list(user)


@router.post("", response_model=AlertSubscriptionRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(csrf_protect)])
async def create_subscription(data: AlertSubscriptionCreate, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    item = await AlertSubscriptionService(session).create(user, data)
    if not item:
        raise HTTPException(status_code=404, detail="Saved location not found.")
    return item


@router.patch("/{subscription_id}", response_model=AlertSubscriptionRead, dependencies=[Depends(csrf_protect)])
async def update_subscription(subscription_id: UUID, data: AlertSubscriptionUpdate, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    item = await AlertSubscriptionService(session).update(user, subscription_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Alert subscription not found.")
    return item


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(csrf_protect)])
async def delete_subscription(subscription_id: UUID, user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)):
    if not await AlertSubscriptionService(session).delete(user, subscription_id):
        raise HTTPException(status_code=404, detail="Alert subscription not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
