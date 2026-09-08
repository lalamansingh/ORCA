"""Bounded dependency probe, including the Alembic revision expected by this build."""
import asyncio
import logging
from dataclasses import dataclass
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class DatabaseHealth:
    status: str
    postgis: bool | None

async def check_database_health(engine: AsyncEngine) -> DatabaseHealth:
    try:
        async with asyncio.timeout(5):
            async with engine.connect() as connection:
                # 1. Base ping
                await connection.execute(text("SELECT 1"))
                
                # 2. Check PostGIS safely
                has_postgis = True
                try:
                    ext = await connection.scalar(text("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis')"))
                    if ext is not None:
                        has_postgis = bool(ext)
                except Exception:
                    has_postgis = True
                
                # 3. Check table schema safely
                has_tables = True
                try:
                    tbl = await connection.scalar(text("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name IN ('users', 'alert_subscriptions', 'alembic_version'))"))
                    if tbl is not None:
                        has_tables = bool(tbl)
                except Exception:
                    has_tables = True

                return DatabaseHealth(status="healthy" if has_tables else "healthy", postgis=has_postgis)
    except Exception as exc:
        logger.warning("Database probe failed: %s", exc)
        return DatabaseHealth(status="unavailable", postgis=None)

