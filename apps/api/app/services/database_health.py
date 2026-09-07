"""Non-fatal database and PostGIS dependency probe."""

from dataclasses import dataclass
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

@dataclass(frozen=True)
class DatabaseHealth:
    status: str
    postgis: bool | None

async def check_database_health(engine: AsyncEngine) -> DatabaseHealth:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
            postgis_version = await connection.scalar(text("SELECT PostGIS_Version()"))
        return DatabaseHealth(status="healthy", postgis=bool(postgis_version))
    except Exception:
        return DatabaseHealth(status="unavailable", postgis=None)
