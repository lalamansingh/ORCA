import asyncio
from typing import Any

import httpx

from app.providers.errors import ProviderRateLimitError, ProviderResponseError, ProviderTimeoutError, ProviderUnavailableError


async def get_json(client: httpx.AsyncClient, url: str, params: dict[str, Any], timeout: float, retries: int) -> dict[str, Any]:
    for attempt in range(retries + 1):
        try:
            response = await client.get(url, params=params, timeout=timeout)
            if response.status_code == 429:
                if attempt < retries:
                    await asyncio.sleep(0.15 * (attempt + 1))
                    continue
                raise ProviderRateLimitError("Forecast provider rate limit reached.")
            if response.status_code >= 500:
                if attempt < retries:
                    await asyncio.sleep(0.15 * (attempt + 1))
                    continue
                raise ProviderUnavailableError("Forecast provider is temporarily unavailable.")
            if response.status_code >= 400:
                raise ProviderResponseError("Forecast provider rejected the request.")
            payload = response.json()
            if not isinstance(payload, dict):
                raise ProviderResponseError("Forecast provider returned an invalid response.")
            return payload
        except httpx.TimeoutException as exc:
            if attempt >= retries:
                raise ProviderTimeoutError("Forecast provider timed out.") from exc
        except httpx.RequestError as exc:
            if attempt >= retries:
                raise ProviderUnavailableError("Forecast provider could not be reached.") from exc
        except ValueError as exc:
            raise ProviderResponseError("Forecast provider returned invalid JSON.") from exc
    raise ProviderUnavailableError("Forecast provider could not be reached.")


async def get_text(client: httpx.AsyncClient, url: str, timeout: float, retries: int, max_bytes: int = 1_000_000) -> str:
    """Fetch bounded provider text with controlled retry and error semantics."""
    for attempt in range(retries + 1):
        try:
            response = await client.get(url, timeout=timeout)
            if response.status_code == 429:
                if attempt < retries:
                    await asyncio.sleep(0.15 * (attempt + 1))
                    continue
                raise ProviderRateLimitError("Alert provider rate limit reached.")
            if response.status_code >= 500:
                if attempt < retries:
                    await asyncio.sleep(0.15 * (attempt + 1))
                    continue
                raise ProviderUnavailableError("Alert provider is temporarily unavailable.")
            if response.status_code >= 400:
                raise ProviderResponseError("Alert provider rejected the request.")
            if len(response.content) > max_bytes:
                raise ProviderResponseError("Alert provider response exceeded the safe size limit.")
            return response.text
        except httpx.TimeoutException as exc:
            if attempt >= retries:
                raise ProviderTimeoutError("Alert provider timed out.") from exc
        except httpx.RequestError as exc:
            if attempt >= retries:
                raise ProviderUnavailableError("Alert provider could not be reached.") from exc
    raise ProviderUnavailableError("Alert provider could not be reached.")
