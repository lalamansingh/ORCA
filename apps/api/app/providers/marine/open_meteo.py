from datetime import UTC, datetime
from typing import Any

import httpx

from app.providers.errors import DataUnavailableError
from app.providers.http import get_json
from app.providers.marine.base import MarineWeatherProvider
from app.providers.parsing import column_value, measurement, timestamp
from app.schemas.evidence import DataFreshness, DataSource, EvidenceItem, Location
from app.schemas.marine import COASTAL_MODEL_LIMITATION, MARINE_DECISION_SUPPORT_LIMITATION, MarineConditions, MarineDailySummary, MarineForecastPoint, MarineResponse

MARINE_FIELDS = ["wave_height", "wave_direction", "wave_period", "wave_peak_period", "wind_wave_height", "wind_wave_direction", "wind_wave_period", "swell_wave_height", "swell_wave_direction", "swell_wave_period", "sea_surface_temperature", "ocean_current_velocity", "ocean_current_direction", "sea_level_height_msl"]
DAILY_FIELDS = ["wave_height_max", "wave_direction_dominant", "wave_period_max", "swell_wave_height_max"]


def _conditions(values: dict[str, Any], time_value: Any) -> MarineConditions:
    return MarineConditions(
        observed_at=timestamp(time_value),
        wave_height=measurement(values.get("wave_height"), "m"),
        wave_direction=measurement(values.get("wave_direction"), "°"),
        wave_period=measurement(values.get("wave_period"), "s"),
        wave_peak_period=measurement(values.get("wave_peak_period"), "s"),
        wind_wave_height=measurement(values.get("wind_wave_height"), "m"),
        wind_wave_direction=measurement(values.get("wind_wave_direction"), "°"),
        wind_wave_period=measurement(values.get("wind_wave_period"), "s"),
        swell_height=measurement(values.get("swell_wave_height"), "m"),
        swell_direction=measurement(values.get("swell_wave_direction"), "°"),
        swell_period=measurement(values.get("swell_wave_period"), "s"),
        sea_surface_temperature=measurement(values.get("sea_surface_temperature"), "°C"),
        ocean_current_speed=measurement(values.get("ocean_current_velocity"), "m/s"),
        ocean_current_direction=measurement(values.get("ocean_current_direction"), "°"),
        sea_level_height=measurement(values.get("sea_level_height_msl"), "m"),
    )


def _has_marine_data(conditions: MarineConditions | None) -> bool:
    return bool(conditions and any(value is not None for key, value in conditions.__dict__.items() if key != "observed_at"))


class OpenMeteoMarineProvider(MarineWeatherProvider):
    name = "open_meteo_marine"

    def __init__(self, client: httpx.AsyncClient, base_url: str, timeout: float, retries: int) -> None:
        self.client, self.base_url, self.timeout, self.retries = client, base_url, timeout, retries

    async def get_conditions(self, latitude: float, longitude: float, timezone: str, target_time: datetime | None = None) -> MarineResponse:
        params: dict[str, Any] = {"latitude": latitude, "longitude": longitude, "current": ",".join(MARINE_FIELDS), "hourly": ",".join(MARINE_FIELDS), "daily": ",".join(DAILY_FIELDS), "forecast_hours": 48, "forecast_days": 3, "timezone": timezone, "timeformat": "unixtime", "length_unit": "metric", "velocity_unit": "ms", "cell_selection": "sea"}
        if target_time:
            params.update(start_date=target_time.date().isoformat(), end_date=target_time.date().isoformat())
            params.pop("forecast_hours", None)
            params.pop("forecast_days", None)
        payload = await get_json(self.client, self.base_url, params, self.timeout, self.retries)
        retrieved_at = datetime.now(UTC)
        current_block = payload.get("current") if isinstance(payload.get("current"), dict) else {}
        current = _conditions(current_block, current_block.get("time")) if current_block else None
        hourly_block = payload.get("hourly") if isinstance(payload.get("hourly"), dict) else {}
        times = hourly_block.get("time") if isinstance(hourly_block.get("time"), list) else []
        hourly = [MarineForecastPoint(**_conditions({field: column_value(hourly_block, field, index) for field in MARINE_FIELDS}, time_value).model_dump()) for index, time_value in enumerate(times[:48])]
        if not _has_marine_data(current) and not any(_has_marine_data(point) for point in hourly):
            raise DataUnavailableError("Marine conditions are unavailable for this location.")
        daily_block = payload.get("daily") if isinstance(payload.get("daily"), dict) else {}
        daily_times = daily_block.get("time") if isinstance(daily_block.get("time"), list) else []
        daily = [MarineDailySummary(date=timestamp(time_value).date().isoformat(), wave_height_max=measurement(column_value(daily_block, "wave_height_max", index), "m"), wave_direction_dominant=measurement(column_value(daily_block, "wave_direction_dominant", index), "°"), wave_period_max=measurement(column_value(daily_block, "wave_period_max", index), "s"), swell_height_max=measurement(column_value(daily_block, "swell_wave_height_max", index), "m")) for index, time_value in enumerate(daily_times[:3])]
        provider_location = Location(latitude=float(payload.get("latitude", latitude)), longitude=float(payload.get("longitude", longitude)))
        source = DataSource(provider="Open-Meteo", dataset="Marine Weather API", source_url=self.base_url, provider_location=provider_location)
        evidence = []
        if current:
            for parameter, value in [("wave_height", current.wave_height), ("swell_height", current.swell_height), ("sea_surface_temperature", current.sea_surface_temperature), ("ocean_current_speed", current.ocean_current_speed)]:
                if value:
                    evidence.append(EvidenceItem(parameter=parameter, value=value.value, unit=value.unit, source="Open-Meteo Marine Weather API", source_url=self.base_url, observed_at=current.observed_at, retrieved_at=retrieved_at, freshness=DataFreshness.CURRENT))
        return MarineResponse(location=Location(latitude=latitude, longitude=longitude), current=current if _has_marine_data(current) else None, hourly=hourly, daily=daily, timezone=str(payload.get("timezone", timezone)), source=source, retrieved_at=retrieved_at, evidence=evidence, limitations=[MARINE_DECISION_SUPPORT_LIMITATION, COASTAL_MODEL_LIMITATION])
