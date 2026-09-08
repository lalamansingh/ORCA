# ORCA deployment

Primary path: **Vercel frontend + Railway Docker API + persistent PostGIS database**.
The API and database share a Railway project and region. Prefer Singapore if available
for the account; colocating them matters more than the exact region. One API replica,
one Uvicorn worker, pool size 3 and overflow 2 suit the initial demo. No Redis or new
infrastructure is required.

This is deployment preparation, not evidence that cloud resources exist. See
[hosted validation](hosted-validation.md) for measured results and open blockers.

## Local full stack

Prerequisites: Docker with Compose. Node 22+ and Python 3.13 + uv are needed only
for host-side development/checks. Docker uses locked npm/uv dependencies.

```sh
docker compose up --build
```

Open http://localhost:3000; backend http://localhost:8000; API prefix `/api/v1`.
The Compose defaults are local-only. No private env file is necessary for this
command. PostGIS 16 / 3.4 uses a named volume; a healthy database precedes one
migration job. API waits for migration success; frontend waits for API readiness.
The database and application ports are bound to loopback.

```sh
make demo
# make demo also runs the explicit idempotent fixture seed.
# Repeat it if needed: make seed-demo
# Register your own account at /register; the fixture operator has no password.
make system-check
```

`make demo` explicitly selects demo PFZ/alerts and enables demo route geometry.
Weather/marine still use Open-Meteo. It is NOT a fully offline forecast demo.
No live provider failure silently selects fixtures. Existing scenario registry
entries are descriptions; they are not all wired to runtime scenario controls.
For a port conflict, set `WEB_PORT`, `API_PORT`, `POSTGRES_PORT` and use a separate
Compose project. API URL is built into the frontend, so changing it requires rebuild.

Host-side development:

```sh
npm ci
cp .env.example .env.local
cd apps/api
cp .env.example .env
uv sync --frozen
# Set a private JWT secret in .env; start the database separately.
uv run alembic upgrade head
uv run uvicorn app.main:app --port 8000
# In another terminal at repository root:
npm run dev
```

## Railway database

Use a reviewed PostGIS-capable PostgreSQL 16 service/template. The plain Railway
Postgres image does not guarantee PostGIS. Inspect the template image and pin its
Postgres/PostGIS versions before provisioning. An explicit `postgis/postgis:16-3.4`
service with a volume at `/var/lib/postgresql/data` is compatible with this repo;
Railway hosts it, but you own its maintenance and backup configuration. Supply
unique POSTGRES_DB/USER/PASSWORD through Railway variables. Do not deploy it without
a volume. Do not expose its TCP port publicly unless required for controlled admin use.

Run in the database service with its privileged setup user:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
```

No pgvector dependency exists. Keep all durable business data in Postgres. Provider
caches and metrics are disposable; no durable raster cache is required.

For a TLS-enabled compatible managed database, set `DATABASE_SSL=true`; the client
uses system CA verification. Configure trusted CA roots if the service uses a
private CA. Never use `ssl=False` to work around certificate errors. The explicit
PostGIS container above does not configure TLS itself: `DATABASE_SSL=false` is
acceptable only over Railway's private service network for the prototype. For
public database connections provision TLS and verify it before release. Use a URL
without libpq-only `sslmode` parameters; the application normalizes postgres://
and postgresql:// into the asyncpg dialect and configures SSL separately.

## Railway API — exact settings

Create a service from the repository, set **Root Directory `/apps/api`**, and set
**Config File `/railway.toml`** (repository-absolute). Dockerfile path in that
config is `Dockerfile`, relative to the service root. Select the main branch and
turn on Wait for CI. Do not expose production variables to fork/preview builds.

Set variables in Railway, never source control:

```dotenv
APP_ENV=production
DEBUG=false
ORCA_VERSION=0.1.0-hackathon
FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN
CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN
DATABASE_URL=<private PostGIS connection URL>
JWT_SECRET_KEY=<unique random value of at least 32 characters>
COOKIE_SECURE=true
COOKIE_SAMESITE=none
DATABASE_POOL_SIZE=3
DATABASE_MAX_OVERFLOW=2
DATABASE_POOL_TIMEOUT=10
WEB_CONCURRENCY=1
METRICS_ENABLED=false
LLM_ENABLED=false
ORCA_DEMO_MODE=false
ORCA_ALLOW_DEMO_FALLBACK=false
```

Select `DATABASE_SSL` according to the verified database transport above. If LLM
is enabled, set LLM_PROVIDER=openai and OPENAI_API_KEY privately. All other keys
and bounded route/ranking/provider settings are in `apps/api/.env.example`.
Hosted `demo` applies the same secret, HTTPS, debug and cookie validation as production.

Railway config executes `.venv/bin/alembic upgrade head` once in a predeploy
container. Set the platform predeploy timeout to 300 seconds. A nonzero exit blocks
rollout. Do not configure migrations again in the start command. Container CMD
binds `0.0.0.0:$PORT` and defaults to one worker. Never run concurrent release jobs;
serialize deployments. Readiness checks database, PostGIS and exact Alembic heads,
within five seconds. It returns 503 on failure. Liveness calls no dependencies.

The historical initial migration is now frozen. A database stranded by the old
broken migration sequence must be restored/recreated if disposable, or inspected
and repaired by a database owner. Never stamp an unknown schema to head. Migration
08 fills unknown PFZ status with STALE, enforces NOT NULL and adds a missing spatial
index. Migration 09 aligns message timestamps and alert defaults. Later rollbacks cannot automatically reverse enum additions or alert history.

## Vercel frontend

Import the repository at its root; use Next.js defaults with `npm ci` and
`npm run build`. Set `NEXT_PUBLIC_API_URL=https://YOUR-API-DOMAIN` before building.
No vercel.json is needed. Public env contains no secrets. Production builds reject
missing/non-HTTPS API URLs on Vercel. Fonts use a system stack, so build does not
fetch Google Fonts. MapLibre loads only in a client effect; tiles come from
OpenFreeMap. CSP allows that origin and the selected API. Inline script/style
allowances preserve Next.js static rendering and map styles; no wildcard connect
policy or production unsafe-eval is used. Vercel HTTPS gets HSTS.

## Cookie and browser verification

API issues host-only HttpOnly access/refresh cookies. For unrelated Vercel/Railway
domains use Secure + SameSite=None and exact credentialed CORS. Frontend obtains
its CSRF header from `GET /api/v1/auth/csrf` with credentials, since it cannot read
a cookie on the API domain. The endpoint is no-store; untrusted origins cannot
read it through CORS. Register/login/refresh rotate cookie material.

Third-party cookie restrictions can still block unrelated platform domains.
Test the actual judging browser. Prefer sibling custom domains `app.example.org`
and `api.example.org`, using Secure + SameSite=lax, if available. No purchase is
required, but platform URLs cannot be called auth-verified until this test passes.

Register, login, reload, /me, CSRF-protected profile update, refresh, logout and
expired/revoked token handling must be tested on the actual domains. CLI cookie
jars do not prove browser third-party cookie support. The API has no SSE endpoint;
streaming and persistent LangGraph checkpoints must not be advertised as verified.

## Refresh jobs and demo deployment

Use explicit manual pre-demo refreshes for this hackathon. In a Railway API service
shell (the image working directory is `/app`):

```sh
.venv/bin/python -m app.scripts.refresh_pfz
.venv/bin/python -m app.scripts.refresh_alerts
```

Run before judging, inspect statuses/freshness, and repeat only within configured
provider cadence. They do not block startup. Geofence sources require an approved,
versioned dataset; no scheduled ingestion CLI is connected. SST/chlorophyll are
explicit demo samples; there is no live metadata refresh to schedule.

Dedicated hosted demo: copy production variables, change APP_ENV=demo,
ORCA_DEMO_MODE=true, PFZ_PROVIDERS=demo and ALERT_PROVIDERS=demo. Then run once:

```sh
.venv/bin/python -m scripts.seed_development
```

Seed is idempotent and rejects production or missing demo opt-in. Register a
separate judging account in the UI; share its password privately. There is no
hidden admin or unauthenticated reset endpoint. Use a disposable sibling database
to reset an entire demo; never reuse the production database for this purpose.

## Backups, rollback and retention

Enable daily Railway volume backups and take a manual pre-demo snapshot. These
are account actions; this repository does not enable or verify them. Custom
PostGIS images do not automatically inherit Railway Postgres PITR support.
Additionally, use PostgreSQL 16 client tools and a private libpq URL (not
`postgresql+asyncpg://`), preferably via a protected .pgpass file:

```sh
pg_dump --dbname="$ORCA_BACKUP_DATABASE_URL" --format=custom --no-owner --file=orca-pre-demo.dump
pg_restore --list orca-pre-demo.dump
# Verify restoration into a NEW disposable database, never the source:
pg_restore --dbname="$ORCA_RESTORE_DATABASE_URL" --no-owner --exit-on-error orca-pre-demo.dump
```

Keep dumps outside Git and access-restricted. Vercel and Railway deploy history
can restore a known compatible application version. Database rollback requires
migration-specific review and a tested backup; prefer forward fixes. No automatic
schema downgrade is promised. Conversation/messages persist in Postgres; graph
checkpoints do not exist. Review demo retention weekly and delete the disposable
demo database after judging. Production conversation deletion/retention remains
an owner-reviewed operation; do not run broad cleanup SQL unreviewed.

## Smoke checks

```sh
cd apps/api
uv run python -m scripts.deployment_smoke --api-url https://YOUR-API-DOMAIN --origin https://YOUR-FRONTEND-DOMAIN
# Explicitly call external providers:
uv run python -m scripts.deployment_smoke --api-url https://YOUR-API-DOMAIN --providers
# Dedicated account only; reads ORCA_SMOKE_EMAIL/PASSWORD from private environment:
uv run python -m scripts.deployment_smoke --api-url https://YOUR-API-DOMAIN --demo-account
```

The default is read-only. Account mode mutates sessions and creates a conversation.
A 200 response is transport evidence, not proof of live data or safety clearance.
From repo root run `ORCA_WEB_URL=https://YOUR-FRONTEND-DOMAIN npm run test:e2e`.
Add `ORCA_E2E_DEMO=true` only for a disposable demo: it creates an account.

## Troubleshooting

- 503 ready: inspect PostGIS version, Alembic head and DB connectivity; do not replace with liveness.
- Migration duplicate table: inspect historical partial install; do not silently skip unknown tables.
- Login works but updates fail: verify credentialed CSRF fetch, CORS origin and browser cookie policy.
- Old API target: rebuild frontend; NEXT_PUBLIC variables are build-time values.
- Route unavailable: expected without trusted masks; explicit demo is geometry only.
- No PFZ: run controlled refresh and inspect source date/status; do not invent zones.
- Fonts/network: system fonts are local; external map tiles and live providers still need internet.

Platform references checked during this step: [Railway monorepos](https://docs.railway.com/deployments/monorepo),
[predeploy commands](https://docs.railway.com/deployments/pre-deploy-command),
[Postgres support](https://docs.railway.com/databases/postgresql),
[backup operations](https://docs.railway.com/guides/postgres-backups-restores).
