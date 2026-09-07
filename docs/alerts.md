# ORCA marine alerts

## Scope and safety boundary

Step 7 consolidates provider advisories. It does not calculate an overall risk score, issue a safe/unsafe fishing recommendation, infer official warnings from weather thresholds, or deliver push/SMS/WhatsApp notifications.

> ORCA consolidates advisory information for decision support. Always follow official maritime, meteorological and local authority instructions.

## Architecture

```text
GET /api/v1/alerts
  → AlertService
    → AlertProvider implementations
      → IMD CAP public feed / explicit provider state / opt-in demo
    → validate + normalize + deduplicate
    → upsert provider + external_id
    → PostGIS filter, distance and containment
```

Provider adapters own all source-format behavior. `AlertService` owns concurrency, caching, partial results, deduplication, persistence and deterministic summaries. API routes own parameter validation only.

## Normalized contract

Types: `CYCLONE`, `STORM_SURGE`, `HIGH_WAVES`, `SWELL_SURGE`, `STRONG_WIND`, `LIGHTNING`, `HEAVY_RAIN`, `LOW_VISIBILITY`, `TSUNAMI`, `MARINE_HEAT_WAVE`, `OTHER`.

Severity, ascending: `INFO`, `WATCH`, `WARNING`, `SEVERE`, `CRITICAL`. Original provider severity remains in metadata.

Validity status: `ACTIVE`, `UPCOMING`, `EXPIRED`, `CANCELLED`, `UNKNOWN`. Retrieval freshness is separate: `CURRENT`, `RECENT`, `STALE`, `EXPIRED`, `UNKNOWN`.

Source type: `OFFICIAL_ADVISORY`, `FORECAST_RISK`, `INTERNAL_RULE`, `DEMO`. IMD thunderstorm/lightning CAP records are labeled “Lightning risk forecast” and never “lightning detected nearby.”

Geometry supports provider-supplied `Point`, `Polygon`, `MultiPolygon`, and `LineString`. Cyclone forecast tracks and forecast points have separate fields. Missing cyclone properties remain missing. A textual affected area remains text with `geometry=null`; ORCA never fabricates a polygon or radius.

## Providers

### IMD CAP

`ImdCapAlertProvider` consumes the public RSS index and linked CAP 1.2 XML records. CAP record URLs must remain beneath the configured `IMD_CAP_BASE_URL`; arbitrary user URLs are never fetched. Current official records are mapped by event keywords while preserving original CAP event, urgency, severity and certainty metadata.

The IMD public API reference separately documents port warnings, sea/coastal bulletins and cyclone track/cone products. Those interfaces require access through the IMD API portal, so ORCA does not bypass or scrape them. Consequently, cyclone-specific fields and tracks are supported by the normalized schema and map, but populated only when a configured authorized provider supplies them.

### INCOIS

INCOIS is the preferred ocean-state authority, but no stable structured alert feed suitable for robust unauthenticated ingestion was verified during Step 7. The isolated provider therefore reports `NOT_CONNECTED` and links the official Ocean State Forecast service page. It returns no invented advisories.

### Demo

`ORCA_DEMO_MODE=false` by default. Setting it to `true` adds a deterministic ORCA demo provider. Every demo alert title, source type, evidence and provider state identifies `DEMO DATA`; it is not silently mixed with official data.

## Persistence and PostGIS

Migration `20260907_03` expands `MarineAlert`, retains expired history, and adds a unique `(provider, external_id)` index. Refreshes update matching source bulletins rather than creating duplicates.

Location queries execute `ST_DWithin` on geography for radius filtering, `ST_Distance` for distance to the actual geometry, `ST_Covers` for polygon containment, and `ST_ClosestPoint` for the nearest point. Text-only alerts remain available with unknown distance. If PostgreSQL is unavailable, current provider alerts may still be returned, but proximity fields stay null and the response is `partial` with an explicit limitation.

## Result semantics

- `complete`: all configured providers and persistence/query operations succeeded.
- `partial`: at least one usable provider succeeded, but another provider or PostGIS operation did not.
- `unavailable`: no configured real/demo provider could provide a trustworthy current result.
- `NO_ACTIVE_ALERTS`: usable providers were checked and returned no matching current advisory.
- `PROVIDER_UNAVAILABLE`: ORCA could not check; never interpret this as “no alerts.”

## Refresh and configuration

```bash
cd apps/api
uv run python -m app.scripts.refresh_alerts
```

Use an external scheduler or worker to run the command according to `ALERT_REFRESH_INTERVAL_MINUTES` (default 15). Web requests use `ALERT_CACHE_TTL` (default 900 seconds); there is no loop inside request handlers.

Other settings: `ALERT_PROVIDERS`, `IMD_CAP_FEED_URL`, `IMD_CAP_BASE_URL`, `ALERT_REQUEST_TIMEOUT`, `ALERT_MAX_FEED_ITEMS`, `PROVIDER_RETRY_COUNT`, and `ORCA_DEMO_MODE`.

## Subscriptions

Authenticated CRUD persists alert type, minimum severity, radius, active state and an optional owner-verified saved location. Ownership always comes from the session; browser payloads cannot choose a user. Preference storage is implemented, but notification delivery is intentionally not enabled.

## Limitations

- INCOIS alert ingestion is not connected.
- Direct IMD marine/cyclone API products require authorized access and are not integrated.
- The CAP RSS transport can be stale or contain non-marine state/district warnings; location relevance depends on provider geometry and PostGIS. Broad text-only records cannot be spatially resolved without inventing data.
- CAP signatures are preserved in source documents but are not cryptographically verified by ORCA in Step 7.
- Provider availability does not replace monitoring official authority channels.
