import httpx

from app.core.config import Settings
from app.providers.marine.base import MarineWeatherProvider
from app.providers.marine.open_meteo import OpenMeteoMarineProvider
from app.providers.weather.base import WeatherProvider
from app.providers.weather.open_meteo import OpenMeteoWeatherProvider
from app.providers.alerts.base import AlertProvider
from app.providers.alerts.demo import DemoAlertProvider
from app.providers.alerts.imd_cap import ImdCapAlertProvider
from app.providers.alerts.incois import IncoisAlertProvider


def get_weather_provider(settings: Settings, client: httpx.AsyncClient) -> WeatherProvider:
    if settings.weather_provider == "open_meteo":
        return OpenMeteoWeatherProvider(client, settings.open_meteo_weather_base_url, settings.weather_request_timeout, settings.provider_retry_count)
    raise ValueError(f"Unsupported weather provider: {settings.weather_provider}")


def get_marine_provider(settings: Settings, client: httpx.AsyncClient) -> MarineWeatherProvider:
    if settings.marine_provider == "open_meteo":
        return OpenMeteoMarineProvider(client, settings.open_meteo_marine_base_url, settings.marine_request_timeout, settings.provider_retry_count)
    raise ValueError(f"Unsupported marine provider: {settings.marine_provider}")


def get_alert_providers(settings: Settings, client: httpx.AsyncClient) -> list[AlertProvider]:
    providers: list[AlertProvider] = []
    for name in settings.alert_provider_list:
        if name == "imd_cap":
            providers.append(ImdCapAlertProvider(client, settings.imd_cap_feed_url, settings.imd_cap_base_url, settings.alert_request_timeout, settings.provider_retry_count, settings.alert_max_feed_items))
        elif name == "incois":
            providers.append(IncoisAlertProvider())
        elif name == "demo" and settings.orca_demo_mode:
            providers.append(DemoAlertProvider())
        else:
            raise ValueError(f"Unsupported or disabled alert provider: {name}")
    if settings.orca_demo_mode and "demo" not in settings.alert_provider_list:
        providers.append(DemoAlertProvider())
    return providers
