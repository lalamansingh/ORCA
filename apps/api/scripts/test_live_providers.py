"""Manual smoke test for normalized providers; does not persist coordinates or payloads."""

import asyncio

import httpx

from app.core.config import get_settings
from app.providers.factory import get_marine_provider, get_weather_provider


async def main() -> None:
    settings = get_settings()
    async with httpx.AsyncClient(headers={"User-Agent": "ORCA/0.1 provider-smoke-test"}) as client:
        weather, marine = await asyncio.gather(
            get_weather_provider(settings, client).get_conditions(13.0, 80.35, "auto"),
            get_marine_provider(settings, client).get_conditions(13.0, 80.35, "auto"),
        )
    print({
        "weather": weather.source.dataset,
        "wind": weather.current.wind_speed.model_dump() if weather.current and weather.current.wind_speed else None,
        "visibility": weather.current.visibility.model_dump() if weather.current and weather.current.visibility else None,
        "marine": marine.source.dataset,
        "wave": marine.current.wave_height.model_dump() if marine.current and marine.current.wave_height else None,
        "sst": marine.current.sea_surface_temperature.model_dump() if marine.current and marine.current.sea_surface_temperature else None,
        "current": marine.current.ocean_current_speed.model_dump() if marine.current and marine.current.ocean_current_speed else None,
    })


if __name__ == "__main__":
    asyncio.run(main())
