"""Idempotent Chennai-area development fixtures. They are not live advisories."""
import asyncio
from datetime import UTC, datetime
from sqlalchemy import select
from geoalchemy2.elements import WKTElement
from app.core.config import get_settings
from app.db.models import AlertType, Conversation, LocationType, MarineAlert, MarineZone, Message, MessageRole, PotentialFishingZone, Severity, User, ZoneType, SavedLocation
from app.db.session import create_database_engine, create_session_factory

async def seed() -> None:
    engine = create_database_engine(get_settings().database_url)
    factory = create_session_factory(engine)
    async with factory() as session:
        user = await session.scalar(select(User).where(User.email == "demo.operator@orca.local"))
        if user is None:
            user = User(email="demo.operator@orca.local", full_name="ORCA Demo Operator")
            session.add(user); await session.flush()
        if not await session.scalar(select(SavedLocation).where(SavedLocation.user_id == user.id)):
            session.add(SavedLocation(user_id=user.id, name="Demo Chennai Harbour", location_type=LocationType.HOME_HARBOUR, latitude=13.08, longitude=80.27, geometry=WKTElement("POINT(80.27 13.08)", srid=4326)))
        if not await session.scalar(select(Conversation).where(Conversation.user_id == user.id)):
            conversation = Conversation(user_id=user.id, title="Demo fishing safety query", language="en")
            session.add(conversation); await session.flush()
            session.add(Message(conversation_id=conversation.id, role=MessageRole.USER, content="Demo query only", created_at=datetime.now(UTC)))
        if not await session.scalar(select(PotentialFishingZone).where(PotentialFishingZone.external_id == "demo-pfz-chennai-01")):
            session.add(PotentialFishingZone(external_id="demo-pfz-chennai-01", name="Demo PFZ South-East", geometry=WKTElement("MULTIPOLYGON(((80.34 13.00,80.38 13.00,80.38 13.04,80.34 13.04,80.34 13.00)))", srid=4326), centroid=WKTElement("POINT(80.36 13.02)", srid=4326), source="ORCA development fixture", confidence="High"))
        if not await session.scalar(select(MarineZone).where(MarineZone.name == "Demo Restricted Waters")):
            session.add(MarineZone(name="Demo Restricted Waters", zone_type=ZoneType.RESTRICTED_WATER, geometry=WKTElement("MULTIPOLYGON(((80.25 13.05,80.29 13.05,80.29 13.09,80.25 13.09,80.25 13.05)))", srid=4326), source="ORCA development fixture"))
        if not await session.scalar(select(MarineAlert).where(MarineAlert.external_id == "demo-alert-01")):
            session.add(MarineAlert(external_id="demo-alert-01", alert_type=AlertType.HIGH_WAVES, severity=Severity.MODERATE, title="Demo High Wave Watch", geometry=WKTElement("POINT(80.31 13.04)", srid=4326), source="ORCA development fixture"))
        await session.commit()
    await engine.dispose()

if __name__ == "__main__": asyncio.run(seed())
