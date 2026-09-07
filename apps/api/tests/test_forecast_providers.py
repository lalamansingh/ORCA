from datetime import UTC, datetime, timedelta

import httpx
import pytest

from app.providers.errors import DataUnavailableError, ProviderResponseError, ProviderTimeoutError, ProviderUnavailableError
from app.providers.marine.open_meteo import OpenMeteoMarineProvider
from app.providers.weather.open_meteo import OpenMeteoWeatherProvider
from app.schemas.weather import WeatherConditions, WeatherForecastPoint
from app.services.forecast_lookup import find_forecast_at_time


WEATHER_PAYLOAD = {
    "latitude": 13.1,
    "longitude": 80.3,
    "timezone": "Asia/Kolkata",
    "current": {"time": 1788750000, "temperature_2m": 29.2, "apparent_temperature": 32.1, "relative_humidity_2m": 76, "precipitation": 0.2, "rain": 0.2, "weather_code": 2, "cloud_cover": 45, "surface_pressure": 1007, "visibility": 8400, "wind_speed_10m": 18, "wind_direction_10m": 225, "wind_gusts_10m": 27},
    "hourly": {"time": [1788750000], "temperature_2m": [29.2], "apparent_temperature": [32.1], "relative_humidity_2m": [76], "precipitation": [0.2], "rain": [0.2], "weather_code": [2], "cloud_cover": [45], "surface_pressure": [1007], "visibility": [8400], "wind_speed_10m": [18], "wind_direction_10m": [225], "wind_gusts_10m": [27]},
}
MARINE_PAYLOAD = {
    "latitude": 13.0,
    "longitude": 80.4,
    "timezone": "Asia/Kolkata",
    "current": {"time": 1788750000, "wave_height": 1.7, "wave_direction": 120, "wave_period": 7.2, "wave_peak_period": 9.0, "wind_wave_height": 0.5, "wind_wave_direction": 140, "wind_wave_period": 4.1, "swell_wave_height": 1.2, "swell_wave_direction": 110, "swell_wave_period": 8.4, "sea_surface_temperature": 28.6, "ocean_current_velocity": 0.42, "ocean_current_direction": 35, "sea_level_height_msl": 0.3},
    "hourly": {"time": [1788750000], "wave_height": [1.7], "wave_direction": [120], "wave_period": [7.2], "wave_peak_period": [9], "wind_wave_height": [0.5], "wind_wave_direction": [140], "wind_wave_period": [4.1], "swell_wave_height": [1.2], "swell_wave_direction": [110], "swell_wave_period": [8.4], "sea_surface_temperature": [28.6], "ocean_current_velocity": [0.42], "ocean_current_direction": [35], "sea_level_height_msl": [0.3]},
    "daily": {"time": [1788739200], "wave_height_max": [2.1], "wave_direction_dominant": [125], "wave_period_max": [8.2], "swell_wave_height_max": [1.4]},
}


def client_for(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


@pytest.mark.asyncio
async def test_weather_normalizes_units_and_builds_evidence() -> None:
    client = client_for(lambda _request: httpx.Response(200, json=WEATHER_PAYLOAD))
    response = await OpenMeteoWeatherProvider(client, "https://weather.test", 1, 0).get_conditions(13.08, 80.27, "auto")
    assert response.current and response.current.visibility.value == 8.4
    assert response.current.wind_speed.unit == "km/h"
    assert response.current.weather_description == "Partly cloudy"
    assert {item.parameter for item in response.evidence} >= {"wind_speed", "visibility"}
    await client.aclose()


@pytest.mark.asyncio
async def test_marine_normalizes_current_and_preserves_provider_grid() -> None:
    client = client_for(lambda _request: httpx.Response(200, json=MARINE_PAYLOAD))
    response = await OpenMeteoMarineProvider(client, "https://marine.test", 1, 0).get_conditions(13.08, 80.27, "auto")
    assert response.current and response.current.ocean_current_speed.value == 0.42
    assert response.current.ocean_current_speed.unit == "m/s"
    assert response.source.provider_location.latitude == 13.0
    assert response.limitations
    await client.aclose()


@pytest.mark.asyncio
async def test_marine_null_values_are_unavailable_not_zero() -> None:
    payload = {"latitude": 28.6, "longitude": 77.2, "timezone": "Asia/Kolkata", "current": {"time": 1788750000, "wave_height": None}, "hourly": {"time": [1788750000], "wave_height": [None]}}
    client = client_for(lambda _request: httpx.Response(200, json=payload))
    with pytest.raises(DataUnavailableError):
        await OpenMeteoMarineProvider(client, "https://marine.test", 1, 0).get_conditions(28.6, 77.2, "auto")
    await client.aclose()


@pytest.mark.asyncio
@pytest.mark.parametrize("response,error", [(httpx.Response(500), ProviderUnavailableError), (httpx.Response(200, content=b"bad-json"), ProviderResponseError)])
async def test_provider_response_failures_are_sanitized(response: httpx.Response, error: type[Exception]) -> None:
    client = client_for(lambda _request: response)
    with pytest.raises(error):
        await OpenMeteoWeatherProvider(client, "https://weather.test", 1, 0).get_conditions(13, 80, "auto")
    await client.aclose()


@pytest.mark.asyncio
async def test_provider_timeout_is_sanitized() -> None:
    def timeout(_request):
        raise httpx.ReadTimeout("timeout")
    client = client_for(timeout)
    with pytest.raises(ProviderTimeoutError):
        await OpenMeteoWeatherProvider(client, "https://weather.test", 1, 0).get_conditions(13, 80, "auto")
    await client.aclose()


@pytest.mark.asyncio
async def test_transient_server_error_is_retried_once() -> None:
    calls = 0
    def handler(_request):
        nonlocal calls
        calls += 1
        return httpx.Response(500) if calls == 1 else httpx.Response(200, json=WEATHER_PAYLOAD)
    client = client_for(handler)
    response = await OpenMeteoWeatherProvider(client, "https://weather.test", 1, 1).get_conditions(13, 80, "auto")
    assert response.current and calls == 2
    await client.aclose()


def test_find_forecast_at_time_returns_nearest_timezone_aware_point() -> None:
    start = datetime(2026, 9, 7, 0, tzinfo=UTC)
    points = [WeatherForecastPoint(**WeatherConditions(observed_at=start + timedelta(hours=hour)).model_dump()) for hour in (0, 3, 6)]
    assert find_forecast_at_time(points, start + timedelta(hours=4)).observed_at == start + timedelta(hours=3)
    with pytest.raises(ValueError):
        find_forecast_at_time(points, datetime(2026, 9, 7, 4))
