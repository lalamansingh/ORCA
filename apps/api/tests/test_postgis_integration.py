"""Real PostGIS checks. Opt in only against a migrated disposable test database."""
import os
from uuid import uuid4
import pytest
from geoalchemy2.elements import WKTElement
from sqlalchemy import text, select, func
from app.core.config import Settings
from app.db.session import create_database_engine, create_session_factory
from app.db.models import MarineZone, ZoneType
from app.services.database_health import check_database_health

pytestmark = pytest.mark.skipif(os.getenv("ORCA_TEST_POSTGIS") != "true", reason="Set ORCA_TEST_POSTGIS=true for disposable PostGIS integration")

@pytest.mark.asyncio
async def test_real_postgis_geometry_and_migrated_schema():
    settings = Settings()
    assert settings.app_env == "test", "Integration tests require APP_ENV=test"
    engine = create_database_engine(settings.database_url, settings)
    try:
        assert (await check_database_health(engine)).status == "healthy"
        async with create_session_factory(engine)() as session:
            zone = MarineZone(name=f"integration-{uuid4()}", zone_type=ZoneType.RESTRICTED_WATER, geometry=WKTElement("MULTIPOLYGON(((80 13,81 13,81 14,80 14,80 13)))", srid=4326), source="ORCA test fixture")
            session.add(zone)
            await session.flush()
            inside = await session.scalar(select(func.ST_Covers(MarineZone.geometry, func.ST_SetSRID(func.ST_MakePoint(80.5,13.5),4326))).where(MarineZone.id == zone.id))
            outside = await session.scalar(select(func.ST_Covers(MarineZone.geometry, func.ST_SetSRID(func.ST_MakePoint(82,13.5),4326))).where(MarineZone.id == zone.id))
            assert inside is True and outside is False
            distance = await session.scalar(text("SELECT ST_Distance(ST_SetSRID(ST_Point(80.27,13.08),4326)::geography, ST_SetSRID(ST_Point(80.28,13.08),4326)::geography)"))
            assert 1000 < distance < 1200
            await session.rollback()
    finally:
        await engine.dispose()


def test_real_auth_rotation_and_owner_scoped_conversation():
    from fastapi.testclient import TestClient
    from app.main import create_app
    from app.db.models import Conversation
    settings = Settings()
    assert settings.app_env == "test"
    identities = []
    try:
        with TestClient(create_app(settings)) as first, TestClient(create_app(settings)) as second:
            for client in (first, second):
                email = f"integration-{uuid4()}@example.com"
                response = client.post("/api/v1/auth/register", json={"email":email,"password":str(uuid4()),"full_name":"Integration reviewer"})
                assert response.status_code == 201
                identities.append(response.json()["id"])
            def headers(client):
                return {"X-CSRF-Token":client.get("/api/v1/auth/csrf").json()["csrf_token"]}
            reply = first.post("/api/v1/ai/conversations/messages", headers=headers(first), json={"query":"hello"})
            assert reply.status_code == 200
            conversation_id = reply.json()["conversation_id"]
            assert second.post("/api/v1/ai/conversations/messages", headers=headers(second), json={"query":"hello","conversation_id":conversation_id}).status_code == 404
            assert first.post("/api/v1/ai/conversations/messages", json={"query":"hello"}).status_code == 403
            old_refresh = first.cookies.get("orca_refresh")
            assert first.post("/api/v1/auth/refresh", headers=headers(first)).status_code == 200
            assert first.cookies.get("orca_refresh") != old_refresh
            assert first.get("/api/v1/auth/me").status_code == 200
            assert first.post("/api/v1/auth/logout", headers=headers(first)).status_code == 204
            assert first.get("/api/v1/auth/me").status_code == 401
    finally:
        import asyncio
        async def cleanup():
            from sqlalchemy import delete
            from app.db.models import User
            from uuid import UUID
            engine = create_database_engine(settings.database_url, settings)
            try:
                async with create_session_factory(engine)() as session:
                    ids = [UUID(item) for item in identities]
                    await session.execute(delete(Conversation).where(Conversation.user_id.in_(ids)))
                    await session.execute(delete(User).where(User.id.in_(ids)))
                    await session.commit()
            finally:
                await engine.dispose()
        asyncio.run(cleanup())
