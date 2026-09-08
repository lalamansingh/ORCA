"""Async engine and request-scoped session dependency."""

from collections.abc import AsyncIterator
import ssl

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine


def create_database_engine(database_url: str, settings=None) -> AsyncEngine:
    options = {"timeout": 5, "command_timeout": 15}
    if settings and settings.database_ssl:
        options["ssl"] = ssl.create_default_context()
    return create_async_engine(database_url, hide_parameters=True, pool_pre_ping=True, pool_size=settings.database_pool_size if settings else 3, max_overflow=settings.database_max_overflow if settings else 2, pool_timeout=settings.database_pool_timeout if settings else 10, connect_args=options)


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session(request: Request) -> AsyncIterator[AsyncSession]:
    factory: async_sessionmaker[AsyncSession] = request.app.state.db_session_factory
    async with factory() as session:
        yield session
