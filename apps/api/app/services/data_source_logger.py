import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.models import DataSourceLog

logger = logging.getLogger(__name__)


class DataSourceLogger:
    def __init__(self, session_factory: async_sessionmaker) -> None:
        self.session_factory = session_factory

    async def record(self, provider: str, operation: str, status: str, latency_ms: float, error_code: str | None, metadata: dict[str, Any]) -> None:
        try:
            async with self.session_factory() as session:
                session.add(DataSourceLog(provider=provider, operation=operation, status=status, latency_ms=latency_ms, error_code=error_code, error_message=None, retrieved_at=datetime.now(UTC), metadata_=metadata))
                await session.commit()
        except Exception:
            logger.warning("data_source_log_unavailable provider=%s operation=%s", provider, operation)
