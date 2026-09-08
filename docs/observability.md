# Observability

Structured request logs include request ID, path, status and duration. Provider
failures use sanitized codes; orchestration responses include trace IDs and step
results. Settings → System status shows API/DB/PostGIS health, observed provider
states and honest engine/localization/persistence capability metadata.

`/api/v1/health/live` is cheap liveness. `/api/v1/health/ready` checks DB/PostGIS and
schema with a deadline. `/api/v1/system/data-sources` is last observed state, not
a fresh external probe. `/api/v1/system/capabilities` exposes no secrets.

`/metrics` is disabled by default. If enabled for diagnostics, restrict access at
the hosting edge and use one process; counters/rate limits are not shared. Do not
expose internal operational details to public scraping without a deliberate policy.
Platform logs + these probes are sufficient for the initial demo. A shared limiter,
aggregated metrics and external error tracking are later upgrades, not new dependencies.
