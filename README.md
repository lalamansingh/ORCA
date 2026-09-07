# ORCA — Marine EcOsystem Reasoning with Collaborative Agents

ORCA is a marine-intelligence platform foundation for safer, evidence-aware decisions at sea. The current build pairs a polished Next.js command center with a versioned FastAPI service foundation.

## Architecture

```text
Browser → Next.js frontend → FastAPI /api/v1
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
uv run python -m scripts.seed_development
uv run uvicorn app.main:app --reload --port 8000
```

API documentation is available at `http://localhost:8000/docs`; the health endpoint is `http://localhost:8000/api/v1/health`.

From the project root, `npm run dev:web` and `npm run dev:api` provide equivalent service commands.

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
uv run python -m scripts.seed_development
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

Development uses `COOKIE_SECURE=false` only for local HTTP. Production requires HTTPS, a unique long JWT secret, `COOKIE_SECURE=true`, and explicitly configured frontend CORS origins. State-changing cookie-authenticated requests include a double-submit CSRF header sourced from the `orca_csrf` cookie. The in-memory absence of rate limiting is intentional for this foundation; production login and registration should use a shared store-backed limiter.

### Development user

Register a local account through `/register` after the database has been migrated. No reusable password is committed in project configuration or seed data.

## Marine Map

The `/map` experience uses one client-only MapLibre component shared by the full map, dashboard mini-map, assistant context panel, and route preview. Its base-map style and India-focused fallback view live in `src/features/map/map-config.ts`; browser-only MapLibre code is dynamically loaded after hydration.

### Location

Use **Use my current location** to request browser GPS only after an explicit action. ORCA supports GPS, manual map selection, coordinate entry, and saved locations. A selection made during the current session takes precedence over GPS; GPS is never written to a user profile automatically.

### Map layers and fixtures

The layer panel distinguishes `LIVE`, `PARTIAL`, `DEMO`, `NOT_CONNECTED`, and `UNAVAILABLE`. Alert geometry now comes from normalized providers and is never synthesized from textual affected-area descriptions. PFZ, restricted-zone, and route geometries remain labeled development fixtures; they are not INCOIS data, real boundaries, or route recommendations.

### Location privacy

ORCA does not continuously persist browser GPS, collect background location, or create GPS history. A coordinate reaches the backend only when the user explicitly saves a location (or a future user-directed location action requires it).

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

## Current project status

- Step 1 complete: responsive frontend UI, mock data, maps, charts, and navigation.
- Step 2 complete: FastAPI foundation, `/api/v1/health`, CORS, request IDs, structured errors, logging, validation, and frontend health status.
- Step 3 complete: PostgreSQL/PostGIS models, Alembic migration, repositories, seed fixtures, and dependency-aware health checks.
- Step 4 complete: Argon2 password authentication, HttpOnly JWT cookies, refresh-session revocation, protected routes, and profile foundations.
- Step 5 complete: reusable MapLibre map, explicit GPS/manual location state, typed demo map layers, and authenticated saved-location CRUD.
- Step 6 complete: provider-independent weather/marine forecasts, normalized evidence, caching, partial responses, and dashboard/map/analytics integration.
- Step 7 complete: normalized IMD CAP alerts, provider status, PostGIS ingestion/querying, alert UX/map, and preference CRUD.
- Future work: additional authorized advisory feeds, risk rules, route intelligence, and AI-agent orchestration.

Open-Meteo model forecasts and the public IMD CAP advisory feed are integrated. No deterministic risk engine, fishing-safety recommendation, push delivery, route optimization, or AI agent is implemented yet.
