from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.domain.alerts import AlertSeverity, AlertType
from app.schemas.alerts import AlertSubscriptionCreate
from app.services.alert_subscriptions import AlertSubscriptionService


class FakeLocations:
    def __init__(self, allowed): self.allowed = allowed
    async def for_user_location(self, user_id, location_id): return self.allowed if self.allowed and self.allowed.user_id == user_id and self.allowed.id == location_id else None


class FakeSubscriptions:
    def __init__(self): self.created = None
    async def create(self, user_id, data): self.created = SimpleNamespace(user_id=user_id, **data.model_dump()); return self.created


@pytest.mark.asyncio
async def test_subscription_saved_location_must_belong_to_authenticated_user() -> None:
    user = SimpleNamespace(id=uuid4())
    other_location = SimpleNamespace(id=uuid4(), user_id=uuid4())
    data = AlertSubscriptionCreate(saved_location_id=other_location.id, alert_type=AlertType.CYCLONE, minimum_severity=AlertSeverity.WARNING, radius_km=100)
    service = AlertSubscriptionService(None)  # type: ignore[arg-type]
    service.locations = FakeLocations(other_location)  # type: ignore[assignment]
    service.repository = FakeSubscriptions()  # type: ignore[assignment]
    assert await service.create(user, data) is None  # type: ignore[arg-type]
    assert service.repository.created is None  # type: ignore[union-attr]


@pytest.mark.asyncio
async def test_subscription_uses_session_user_not_payload_user() -> None:
    user = SimpleNamespace(id=uuid4())
    location = SimpleNamespace(id=uuid4(), user_id=user.id)
    data = AlertSubscriptionCreate(saved_location_id=location.id, alert_type=AlertType.HIGH_WAVES, minimum_severity=AlertSeverity.SEVERE, radius_km=75)
    service = AlertSubscriptionService(None)  # type: ignore[arg-type]
    service.locations = FakeLocations(location)  # type: ignore[assignment]
    service.repository = FakeSubscriptions()  # type: ignore[assignment]
    created = await service.create(user, data)  # type: ignore[arg-type]
    assert created.user_id == user.id
    assert created.alert_type == AlertType.HIGH_WAVES
