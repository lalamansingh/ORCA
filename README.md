# ORCA — Marine EcOsystem Reasoning with Collaborative Agents

ORCA is a marine-intelligence platform foundation for safer, evidence-aware decisions at sea. The current build pairs a polished Next.js command center with a versioned FastAPI service foundation.

## Release workflow

```sh
docker compose up --build
# Explicit labelled demo instead:
make demo
# Demo fixtures are seeded by make demo.
```

Open http://localhost:3000 and register an account. Local Compose needs no secret
files; its defaults are strictly local development. Weather/marine and map tiles
still need internet. `make demo` selects fixture PFZ/alerts and route geometry;
it is not an offline operational system.

Checks: `make test`, `make lint`, `make build`, `make system-check`,
`make pre-demo-check`. See [deployment](docs/deployment.md),
[release checklist](docs/deployment-checklist.md), [judge checklist](docs/judge-demo-checklist.md),
[5–7 minute demo](docs/demo-script.md), [actual architecture](docs/architecture.md),
[coverage and limitations](docs/problem-statement-coverage.md), and
[validation report](docs/hosted-validation.md).

## Architecture

```text
Browser → Next.js frontend → FastAPI /api/v1

User query → QueryUnderstandingService → validated structured query
ORCA facts → AIResponseService → fact-only natural-language draft

User → QueryUnderstanding → IntentClassifier → QueryPlanner → LangGraph agents → deterministic services → evidence-backed response
```

- Frontend: Next.js, TypeScript, Tailwind, MapLibre, Recharts
- Backend: FastAPI, Pydantic Settings, SQLAlchemy async, GeoAlchemy2, Alembic, pytest

## Local development

### Frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

The application is available at `http://localhost:3000`.

### Backend

```bash
cd apps/api
cp .env.example .env
uv sync --all-groups
uv run alembic upgrade head
ORCA_DEMO_MODE=true uv run python -m scripts.seed_development
uv run uvicorn app.main:app --reload --port 8000
```

API documentation is available at `http://localhost:8000/docs`; the health endpoint is `http://localhost:8000/api/v1/health`.

### Potential Fishing Zones

PFZ advisories use the official INCOIS WebGIS WFS and are stored in PostGIS. Refresh them explicitly with `uv run python -m app.scripts.refresh_pfz`; the nearest-zone endpoint is `/api/v1/pfz/nearest`. INCOIS does not publish a validity end in this feed, so ORCA exposes source date and configured freshness rather than inventing expiry. See [PFZ intelligence](docs/pfz-intelligence.md).

### Ocean products

Ocean-product metadata and point samples are available at `/api/v1/ocean-products`. The current development grid is explicitly DEMO because the investigated public INCOIS historical SST/chlorophyll datasets are stale. See [ocean products](docs/ocean-products.md).

The optional AI language layer is disabled by default (`LLM_ENABLED=false`). It extracts language and intent candidates but never computes marine risk or invents environmental facts. See [llm-layer.md](docs/llm-layer.md).

The deterministic planner endpoint is `POST /api/v1/ai/plan`; it only returns an allowlisted execution plan and never executes tools. See [query-planner.md](docs/query-planner.md).

From the project root, `npm run dev:web` and `npm run dev:api` provide equivalent service commands.

For the complete containerized stack, run `docker compose up --build`. PostGIS is
health-checked, Alembic runs once through the migration job, and the backend and
frontend start only after their dependencies are ready. Production uses the
documented Vercel + Railway architecture in [deployment.md](docs/deployment.md).

### Environment

`NEXT_PUBLIC_API_URL` configures the browser-visible API URL. Backend settings are configured in `apps/api/.env` from its `.env.example` template. Do not commit real `.env` files or secrets.

## Database

ORCA uses PostgreSQL with PostGIS, SQLAlchemy 2.x async sessions, GeoAlchemy2 geometry columns, and Alembic migrations. The app never creates schema automatically; Alembic owns schema evolution.

### Local database setup

```bash
# from the repository root
docker compose --env-file apps/api/.env up -d db
docker compose ps

cd apps/api
uv run alembic upgrade head
ORCA_DEMO_MODE=true uv run python -m scripts.seed_development
```

`DATABASE_URL`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and `POSTGRES_PORT` are configured in `apps/api/.env`. The template contains local-development-only credentials.

### Migrations

```bash
cd apps/api
uv run alembic upgrade head
uv run alembic downgrade -1  # development only; review before running
uv run alembic revision --autogenerate -m "describe change"
```

To reset a development database only, stop the container, remove the `orca-postgres-data` volume, start the database, then rerun the migration and seed commands. Never use this reset flow against shared or production data.

### Database architecture

The initial schema includes User, Conversation, Message, SavedLocation, MarineAlert, PotentialFishingZone, MarineZone, MarineRoute, AlertSubscription, MarineQueryLog, and DataSourceLog. PostGIS geometry supports points, polygons/multipolygons, and routes. The spatial repositories include nearest-PFZ and point-in-zone operations.

All seeded marine, PFZ, alert, and geofence records are explicitly development fixtures—not live advisories or maritime boundaries.

## Checks

```bash
npm run lint
npm run typecheck
npm run build

cd apps/api
uv run pytest
```

## Authentication

ORCA supports email/password registration, login, session restoration, profile updates, refresh-token rotation, and logout. Passwords are Argon2 hashes; raw passwords and raw refresh tokens are never persisted.

Access and refresh JWTs are issued as HttpOnly cookies. Refresh sessions are persisted by token `jti`, enabling revocation on logout and rotation on refresh. Protected frontend routes use a client-side guard because cookies issued by a separately deployed API cannot safely be assumed available to Next.js server middleware.

### Authentication environment variables

Configure `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `COOKIE_SECURE`, and `COOKIE_SAMESITE` in `apps/api/.env`. Never use the placeholder secret from `.env.example` in production.

Generate a local secret before testing authentication:

```bash
openssl rand -hex 32
```

### Security notes

Development uses `COOKIE_SECURE=false` only for local HTTP. Production requires HTTPS, a unique long JWT secret, `COOKIE_SECURE=true`, and explicitly configured frontend CORS origins. State-changing cookie-authenticated requests include a double-submit CSRF header sourced from the `orca_csrf` cookie. Authentication and expensive endpoints have configurable in-process rate limits; horizontally scaled production should replace these with a shared store-backed limiter.

### Development user

Register a local account through `/register` after the database has been migrated. No reusable password is committed in project configuration or seed data.

## Marine Map

The `/map` experience uses one client-only MapLibre component shared by the full map, dashboard mini-map, assistant context panel, and route preview. Its base-map style and India-focused fallback view live in `src/features/map/map-config.ts`; browser-only MapLibre code is dynamically loaded after hydration.

### Location

Use **Use my current location** to request browser GPS only after an explicit action. ORCA supports GPS, manual map selection, coordinate entry, and saved locations. A selection made during the current session takes precedence over GPS; GPS is never written to a user profile automatically.

### Map layers and fixtures

The layer panel distinguishes `LIVE`, `PARTIAL`, `DEMO`, `NOT_CONNECTED`, and `UNAVAILABLE`. Alert geometry now comes from normalized providers and is never synthesized from textual affected-area descriptions. PFZ layers can show ingested advisories; restricted-zone and illustrative route layers remain labelled fixtures. The route page draws its returned geometry with provenance and limitations.

### Location privacy

ORCA does not continuously persist browser GPS, collect background location, or create GPS history. Selected coordinates reach the API for requested conditions, risk, PFZ or assistant actions; they are not saved as GPS history. Saving a location and sending a conversation are explicit persistence actions.

### Saved locations API

Authenticated, owner-scoped saved locations use the existing PostGIS `SavedLocation` point model:

- `GET /api/v1/saved-locations`
- `POST /api/v1/saved-locations`
- `PATCH /api/v1/saved-locations/{id}`
- `DELETE /api/v1/saved-locations/{id}`

The server derives ownership from the authenticated session and never accepts a `user_id` from the browser. State-changing requests use the existing CSRF protection.

## Weather Provider

The development weather adapter uses the Open-Meteo Weather Forecast API through `WeatherProvider → OpenMeteoWeatherProvider`. ORCA normalizes temperature, humidity, precipitation, visibility, pressure, cloud cover, wind speed/direction/gusts, and WMO weather codes. The frontend never calls the provider directly.

## Marine Weather Provider

The marine adapter uses the Open-Meteo Marine Weather API through `MarineWeatherProvider → OpenMeteoMarineProvider`. Normalized fields include waves, wind waves, swell, sea-surface temperature, ocean-current velocity/direction, and model sea-level height. Ocean-current speed uses m/s as ORCA's canonical internal unit.

Responses retain the requested coordinate, provider grid coordinate, forecast timezone, forecast timestamp, retrieval timestamp, source, evidence, and missing values. Missing marine data remains unavailable—it is never converted to zero or silently replaced by a fixture.

Forecast responses are cached in memory for 10 minutes (weather) and 15 minutes (marine). These TTLs are ORCA application decisions, not provider freshness guarantees. Configure providers, URLs, timeouts, retry count, and TTLs in `apps/api/.env`.

The combined endpoint requests weather and marine forecasts concurrently and returns `complete`, `partial`, or `unavailable` without discarding a successful provider response. Provider calls use bounded timeouts, one restrained transient retry by default, sanitized errors, request-context logging, and `DataSourceLog` records when PostgreSQL is available.

API endpoints:

- `GET /api/v1/weather`
- `GET /api/v1/marine`
- `GET /api/v1/conditions`
- `GET /api/v1/system/data-sources`

Forecast/model data is decision support only. It must not be used as the sole source for navigation or emergency decisions; coastal current, tide, and sea-level accuracy can be limited. See `docs/data-sources.md` for the full contract and replacement architecture.

## Marine safety alerts

Step 7 adds `API route → AlertService → AlertProvider → official/public source`, normalized advisory types and severities, alert history, evidence, explicit source status, PostGIS proximity/containment, map geometry, alert details, and authenticated alert-preference CRUD. It does not derive official alerts from Step 6 forecast thresholds.

The live adapter reads IMD-authored Common Alerting Protocol records from the public IMD CAP feed used by the WMO Alert Hub. Direct IMD warning APIs remain access-controlled through the IMD API portal. No stable structured INCOIS alert feed was verified, so `INCOIS Alerts` reports `NOT_CONNECTED` instead of pretending an integration exists.

Alert endpoints:

- `GET /api/v1/alerts`
- `GET /api/v1/alerts/active`
- `GET /api/v1/alerts/{alert_id}`
- `GET|POST /api/v1/alert-subscriptions`
- `PATCH|DELETE /api/v1/alert-subscriptions/{subscription_id}`

Run a single controlled ingestion outside request handlers:

```bash
cd apps/api
uv run python -m app.scripts.refresh_alerts
```

`ALERT_REFRESH_INTERVAL_MINUTES` documents the production polling interval for a future scheduler/worker; the API does not create an uncontrolled background loop. See `docs/alerts.md` for the full provider, data, safety, and demo contract.

## Deterministic marine risk engine

Step 8 adds `RiskInputBuilder → MarineRiskEngine → MarineRiskAssessment` as a provider-independent, versioned, explainable decision-support layer. Weather, marine-model, and spatially relevant active alerts are collected through the existing normalized services. No LLM, prompt, OpenAI/Gemini service, LangGraph flow, or AI agent calculates risk.

The engine returns a 0–100 score with `LOW`, `MODERATE`, `HIGH`, or `EXTREME`, or `UNAVAILABLE` with a null score when required wave/wind information is missing or too stale. Correlated hazards use category caps and diminishing-return aggregation; relevant official alerts apply configurable minimums and cyclone/storm-surge/tsunami overrides. Every result includes factor contributions, sources, timestamps, freshness, data quality, provenance, limitations, and `orca-risk-v1`.

Risk endpoints:

- `POST /api/v1/risk/evaluate`
- `GET /api/v1/risk`
- `GET /api/v1/risk/timeline`
- `GET /api/v1/risk/history`

The dashboard now uses the live deterministic assessment, the map evaluates only after deliberate user action and shows a location risk badge, and analytics evaluates a forecast timeline locally after one provider fetch. Assessment persistence is authenticated, owner-scoped, and opt-in; normal views do not create continuous location history.

All thresholds are ORCA prototype decision-support settings. They require vessel-specific calibration and validation with relevant maritime authorities before production use. See `docs/risk-engine.md` for the exact formula, configuration, alert rules, missing-data policy, and reviewed public reference points.

## Current project status

Steps 1–19 provide the frontend, API, auth, spatial persistence, normalized providers,
deterministic risk/planning/routing/ranking services and language-layer foundations.
Step 20 adds reproducible release configuration, migration repairs, CI spatial checks,
smoke tooling, production config validation and judge-facing landing/assistant/route polish.

The assistant executes authenticated queries and stores conversations, but cross-turn
references, persisted LangGraph execution, streaming and complete translated replies
remain incomplete. Live land masks and authoritative boundary coverage are unavailable;
routing is an explicitly labelled geometry demo. Ocean products are DEMO. PFZ ranking
can return no eligible results when required evidence is missing. Scenario registry
entries are not all interactive runtime scenarios. See the requirement matrix rather
than interpreting earlier step labels as proof of complete integration.

No hosted deployment or hosted end-to-end success is claimed without verified URLs.
ORCA is a decision-support prototype using available environmental and geospatial
data. It is not a certified navigation system or official maritime clearance.
