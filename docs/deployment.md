# ORCA deployment

## Chosen architecture

Use Vercel for the Next.js frontend and Railway for the Dockerized FastAPI API
and managed PostgreSQL with PostGIS. This preserves the browser → HTTPS API →
PostGIS split with minimal hackathon infrastructure. External providers remain
server-side; only `NEXT_PUBLIC_API_URL` is exposed to the browser.

## Local full stack

Copy environment templates, then run `docker compose up --build`. Compose starts
PostGIS, runs the single Alembic migration job, then starts the API and frontend.
The frontend is http://localhost:3000 and API is http://localhost:8000.

## Railway backend

Create a PostGIS-capable PostgreSQL service and API service from this repository.
Configure the API service root/build using `railway.toml`. Set `APP_ENV=production`,
`DATABASE_URL`, a unique 32+ character `JWT_SECRET_KEY`, `COOKIE_SECURE=true`,
`COOKIE_SAMESITE=none` for cross-site Vercel/Railway cookies, exact
`CORS_ORIGINS=https://<frontend-domain>`, and provider/LLM settings as required.
Run exactly once per release, before API rollout:

```sh
cd apps/api && uv run alembic upgrade head
```

Verify PostGIS with `SELECT PostGIS_Version();`. Migration failure blocks the
release. Do not run migrations independently from every web worker.

## Vercel frontend

Import the repository as a Next.js project and set
`NEXT_PUBLIC_API_URL=https://<railway-api-domain>`. Vercel supplies HTTPS and
preview builds. Never expose provider, database, JWT, or LLM secrets as
`NEXT_PUBLIC_*` variables.

## Demo and operations

The hosted judging profile uses `APP_ENV=demo`; enable `ORCA_DEMO_MODE=true` only
for an explicitly labelled deterministic demo. Live failures do not activate
fixtures unless `ORCA_ALLOW_DEMO_FALLBACK=true`, and mixed provenance must remain
visible. Perform PFZ/alert refresh as a controlled Railway scheduled/manual job,
not during web startup.

Before judging: run CI, migrate, verify `/api/v1/health/live` and
`/api/v1/health/ready`, register/login/logout, test the primary and hazard demo
flows, and export the database with `pg_dump "$DATABASE_URL" --format=custom --file=orca-pre-demo.dump` from a trusted admin environment. Never expose a reset
endpoint. Roll back frontend/backend through host deployment history; database
downgrades require migration-specific review and a verified backup.
