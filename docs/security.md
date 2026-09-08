# Security posture

Argon2 passwords, host-only HttpOnly session tokens, refresh rotation/revocation,
owner-scoped saved data and CSRF on persisted conversation/profile operations.
The cross-origin CSRF token endpoint is credentialed, no-store and readable only
by allowed CORS origins. Public production execute/extract debug endpoints return
404; metrics default off. OpenAPI stays enabled for technical review and contains
request schemas, not configuration values. Production debug is rejected.

Exact HTTPS CORS and unique JWT/database credentials are enforced for hosted demo
and production. Demo fixtures are rejected in APP_ENV=production. Provider URLs
come from deployment configuration, not user-entered arbitrary fetch URLs. Route,
planner/reference and map-action boundaries use existing deterministic validation.
Frontend renders API facts as text, never HTML. CSP limits API/tile origins.

`python3 scripts/secret_audit.py` scans current tracked files and every reachable
Git revision using redacted credential patterns. This is not proof that all
possible secret formats are absent. If a real credential is discovered, rotate it
at the issuer and remove it from tracked content; do not print its value. Local
example/test credentials are deliberate and must never be used in hosted services.

`npm audit` and `uv run pip-audit` check advisories. The pytest advisory found in
this step was addressed by updating pytest and pytest-asyncio together, then
running all tests. No live Strix exploit scan was performed in this deployment
pass; unit/integration tests do not establish black-box exploit resistance.

Remaining limits: process-local rate limiting; CSP inline script/style allowance;
no shared abuse store; no certified navigation safety; no hosted cookie verification
until actual domains exist. Do not log request bodies, password fields or raw
provider credentials. Only execute account smoke tests on dedicated disposable data.
