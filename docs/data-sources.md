# ORCA Data Sources

## Provider architecture

Environmental requests follow `API route → service → provider interface → provider implementation → external API`. Provider-specific JSON is normalized inside the adapter. A future provider can implement `WeatherProvider` or `MarineWeatherProvider` and be selected in the provider factory without changing routes or frontend contracts.

## Weather

- Provider: Open-Meteo Weather Forecast API
- Configuration: `WEATHER_PROVIDER`, `OPEN_METEO_WEATHER_BASE_URL`, `WEATHER_REQUEST_TIMEOUT`, `WEATHER_CACHE_TTL`
- Variables: temperature, apparent temperature, humidity, precipitation, rain, WMO weather code, cloud cover, surface pressure, visibility, 10 m wind speed/direction, and gusts
- Units: °C, %, mm, hPa, km, km/h, degrees

## Marine weather

- Provider: Open-Meteo Marine Weather API
- Configuration: `MARINE_PROVIDER`, `OPEN_METEO_MARINE_BASE_URL`, `MARINE_REQUEST_TIMEOUT`, `MARINE_CACHE_TTL`
- Variables: wave height/direction/period/peak period, wind-wave height/direction/period, swell height/direction/period, sea-surface temperature, ocean-current velocity/direction, and sea-level height relative to mean sea level
- Daily summaries: maximum wave height, dominant wave direction, maximum wave period, and maximum swell height
- Units: m, seconds, °C, m/s, degrees

Wave and wind direction describe where waves/wind come from. Ocean-current direction follows the flow—where the current moves toward. The UI labels those semantics explicitly.

## Time and forecast range

Requests use `timezone=auto` by default and responses always include the provider timezone. Provider timestamps are normalized to timezone-aware instants; clients format them in the stated forecast timezone. The default payload is limited to 48 hourly points and three daily marine summaries. Optional `date` selects a forecast date.

## Cache and traffic policy

The in-memory cache keys include provider, coordinates rounded only for key stability at four decimal places, timezone, and requested date. Default TTLs are 600 seconds for weather and 900 seconds for marine. Manual refresh bypasses the cache; normal rendering does not. Independent combined requests run concurrently. Transient connection, 429, and 5xx failures receive one short retry by default.

## Evidence and observability

Normalized evidence carries parameter, value, unit, source, provider URL, forecast time, retrieval time, and freshness. Forecasts use `CURRENT`, not `LIVE`, because they are model outputs rather than certified live observations.

Each actual provider call updates an in-memory provider health snapshot and attempts to write a compact `DataSourceLog` row containing provider, operation, status, latency, error code, time, and non-location metadata. Database logging failure does not invalidate otherwise usable forecast data. Request IDs remain present in application log context.

## Missing data and partial responses

Provider nulls stay null. Inland or unsupported marine locations return “Marine conditions are unavailable for this location”; ORCA does not infer zero waves or zero current. `/api/v1/conditions` preserves weather when marine fails, or marine when weather fails, and labels the response `partial`.

## Limitations

Open-Meteo supplies numerical forecast/model data. It is not INCOIS, IMD, or a certified navigation/advisory service. Model grids may differ slightly from requested coordinates. Coastal tide, current, and sea-level values can be inaccurate.

Forecast/model data is provided for decision support and should not be used as the sole source for navigation or emergency decisions.
