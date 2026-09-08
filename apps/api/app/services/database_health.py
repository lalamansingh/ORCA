"""Bounded dependency probe, including the Alembic revision expected by this build."""
import asyncio
from dataclasses import dataclass
from pathlib import Path
from alembic.script import ScriptDirectory
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

@dataclass(frozen=True)
class DatabaseHealth:
    status: str
    postgis: bool | None

async def check_database_health(engine: AsyncEngine) -> DatabaseHealth:
    try:
        async with asyncio.timeout(5):
            async with engine.connect() as connection:
                postgis_version = await connection.scalar(text("SELECT PostGIS_Version()"))
                revisions = set((await connection.execute(text("SELECT version_num FROM alembic_version"))).scalars())
                expected = set(ScriptDirectory(str(Path(__file__).resolve().parents[2] / "alembic")).get_heads())
        return DatabaseHealth(status="healthy" if revisions == expected and postgis_version else "schema_mismatch", postgis=bool(postgis_version))
    except Exception:
        return DatabaseHealth(status="unavailable", postgis=None)
