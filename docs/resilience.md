# Resilience and demo limits

Provider calls have bounded timeout/retry and cache TTLs. Missing marine input is
unavailable, never a zero measurement. Alert unavailability is not a no-alert
result. Live route masks are absent; routes fail closed unless demo is explicitly
selected. Demo geometry does not imply environmental or legal clearance.

Readiness has a five-second DB/PostGIS/schema deadline and returns 503 when not
ready. No remote provider refresh blocks startup. Migrations run once before
rollout. Conversation requests return an atomic response; no SSE transport or
checkpoint recovery exists. Orchestrator timeout now returns PARTIAL, not SUCCESS.

Single-process metrics/rate limits/cache are ephemeral. Postgres stores business
records. A process restart loses cache/activity counters but not saved records.

Before judging cache Docker images and seed explicit PFZ fixtures. If internet
fails, demonstrate local PFZ/route geometry and deterministic safety tests. Weather,
marine and base-map tiles still depend on internet; no complete offline mode exists.
Never silently substitute fixture data. Check labels in each response and UI.
