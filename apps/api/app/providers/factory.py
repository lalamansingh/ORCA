import httpx

from app.core.config import Settings
from app.providers.marine.base import MarineWeatherProvider
from app.providers.marine.open_meteo import OpenMeteoMarineProvider
from app.providers.weather.base import WeatherProvider
from app.providers.weather.open_meteo import OpenMeteoWeatherProvider


def get_weather_provider(settings: Settings, client: httpx.AsyncClient) -> WeatherProvider:
    if settings.weather_provider == "open_meteo":
        return OpenMeteoWeatherProvider(client, settings.open_meteo_weather_base_url, settings.weather_request_timeout, settings.provider_retry_count)
    raise ValueError(f"Unsupported weather provider: {settings.weather_provider}")


def get_marine_provider(settings: Settings, client: httpx.AsyncClient) -> MarineWeatherProvider:
    if settings.marine_provider == "open_meteo":
        return OpenMeteoMarineProvider(client, settings.open_meteo_marine_base_url, settings.marine_request_timeout, settings.provider_retry_count)
    raise ValueError(f"Unsupported marine provider: {settings.marine_provider}")
