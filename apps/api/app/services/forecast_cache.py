import asyncio
import time
from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass
class CacheEntry(Generic[T]):
    value: T
    expires_at: float


class TTLCache:
    def __init__(self) -> None:
        self._values: dict[str, CacheEntry[object]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> object | None:
        async with self._lock:
            entry = self._values.get(key)
            if entry is None or entry.expires_at <= time.monotonic():
                self._values.pop(key, None)
                return None
            return entry.value

    async def set(self, key: str, value: object, ttl_seconds: int) -> None:
        async with self._lock:
            self._values[key] = CacheEntry(value=value, expires_at=time.monotonic() + ttl_seconds)


def forecast_cache_key(provider: str, latitude: float, longitude: float, timezone: str, target: str | None) -> str:
    return f"{provider}:{latitude:.4f}:{longitude:.4f}:{timezone}:{target or 'current'}"
