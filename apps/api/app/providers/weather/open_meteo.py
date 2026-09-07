from datetime import UTC, datetime
from typing import Any

import httpx

from app.providers.http import get_json
from app.providers.parsing import column_value, measurement, timestamp
from app.providers.weather.base import WeatherProvider
from app.schemas.evidence import DataFreshness, DataSource, EvidenceItem, Location
from app.schemas.weather import WeatherConditions, WeatherForecastPoint, WeatherResponse

WEATHER_FIELDS = ["temperature_2m", "apparent_temperature", "relative_humidity_2m", "precipitation", "rain", "weather_code", "cloud_cover", "surface_pressure", "visibility", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"]
WMO_DESCRIPTIONS = {0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 80: "Rain showers", 81: "Rain showers", 82: "Heavy rain showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail"}


def _conditions(values: dict[str, Any], time_value: Any) -> WeatherConditions:
    code_value = values.get("weather_code")
    code = int(code_value) if isinstance(code_value, (int, float)) else None
    return WeatherConditions(
        observed_at=timestamp(time_value),
        temperature=measurement(values.get("temperature_2m"), "°C"),
        apparent_temperature=measurement(values.get("apparent_temperature"), "°C"),
        humidity=measurement(values.get("relative_humidity_2m"), "%"),
        precipitation=measurement(values.get("precipitation"), "mm"),
        rain=measurement(values.get("rain"), "mm"),
        visibility=measurement(values.get("visibility"), "km", 0.001),
        wind_speed=measurement(values.get("wind_speed_10m"), "km/h"),
        wind_direction=measurement(values.get("wind_direction_10m"), "°"),
        wind_gust=measurement(values.get("wind_gusts_10m"), "km/h"),
        weather_code=code,
        weather_description=WMO_DESCRIPTIONS.get(code, "Weather condition unavailable" if code is None else f"WMO code {code}"),
        cloud_cover=measurement(values.get("cloud_cover"), "%"),
        pressure=measurement(values.get("surface_pressure"), "hPa"),
    )


class OpenMeteoWeatherProvider(WeatherProvider):
    name = "open_meteo_weather"

    def __init__(self, client: httpx.AsyncClient, base_url: str, timeout: float, retries: int) -> None:
        self.client, self.base_url, self.timeout, self.retries = client, base_url, timeout, retries

    async def get_conditions(self, latitude: float, longitude: float, timezone: str, target_time: datetime | None = None) -> WeatherResponse:
        params: dict[str, Any] = {"latitude": latitude, "longitude": longitude, "current": ",".join(WEATHER_FIELDS), "hourly": ",".join(WEATHER_FIELDS), "forecast_hours": 48, "timezone": timezone, "timeformat": "unixtime", "wind_speed_unit": "kmh", "temperature_unit": "celsius", "precipitation_unit": "mm"}
        if target_time:
            params.update(start_date=target_time.date().isoformat(), end_date=target_time.date().isoformat())
            params.pop("forecast_hours", None)
        payload = await get_json(self.client, self.base_url, params, self.timeout, self.retries)
        retrieved_at = datetime.now(UTC)
        current_block = payload.get("current") if isinstance(payload.get("current"), dict) else {}
        current = _conditions(current_block, current_block.get("time")) if current_block else None
        hourly_block = payload.get("hourly") if isinstance(payload.get("hourly"), dict) else {}
        times = hourly_block.get("time") if isinstance(hourly_block.get("time"), list) else []
        hourly = []
        for index, time_value in enumerate(times[:48]):
            values = {field: column_value(hourly_block, field, index) for field in WEATHER_FIELDS}
            hourly.append(WeatherForecastPoint(**_conditions(values, time_value).model_dump()))
        provider_location = Location(latitude=float(payload.get("latitude", latitude)), longitude=float(payload.get("longitude", longitude)))
        source = DataSource(provider="Open-Meteo", dataset="Weather Forecast API", source_url=self.base_url, provider_location=provider_location)
        evidence = []
        if current:
            for parameter, value in [("wind_speed", current.wind_speed), ("visibility", current.visibility), ("temperature", current.temperature), ("precipitation", current.precipitation)]:
                if value:
                    evidence.append(EvidenceItem(parameter=parameter, value=value.value, unit=value.unit, source="Open-Meteo Weather Forecast API", source_url=self.base_url, observed_at=current.observed_at, retrieved_at=retrieved_at, freshness=DataFreshness.CURRENT))
        return WeatherResponse(location=Location(latitude=latitude, longitude=longitude), current=current, hourly=hourly, timezone=str(payload.get("timezone", timezone)), source=source, retrieved_at=retrieved_at, evidence=evidence)
