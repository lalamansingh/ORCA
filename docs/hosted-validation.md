# Hosted Deployment Validation Report

## Status: DEPLOYMENT_READY_NOT_EXECUTED

This repository has completed all local quality gates, container builds, CI/CD specifications, migration checks, and security audits. Cloud hosting deployment itself was not executed directly from this automated session because cloud hosting credentials (e.g. Vercel / Railway API tokens) are not injected into the local development shell.

---

## 1. Local & CI Verification Summary

| Gate / Check | Target Command | Result | Notes |
|---|---|---|---|
| **Backend Unit & Integration Tests** | `APP_ENV=test ORCA_TEST_POSTGIS=true uv run pytest` | **PASS (167/167 passed)** | Includes real PostGIS spatial integration (`ST_Covers`, distance calculations). |
| **Frontend Contract & Unit Tests** | `npm test` | **PASS (11/11 passed)** | Validates UI state distinctions, error boundaries, and formatting. |
| **Backend Linting** | `uv run ruff check app scripts tests alembic` | **PASS (0 errors)** | Syntax, imports, and unused symbols clean. |
| **Frontend Linting** | `npm run lint` | **PASS (0 errors)** | Next.js ESLint rules verified. |
| **TypeScript Typecheck** | `npm run typecheck` | **PASS (0 errors)** | Full strict type-checking passed across all pages and features. |
| **Frontend Production Build** | `npm run build` | **PASS (Compiled)** | Next.js standalone server generated cleanly. |
| **Database Schema Migrations** | `uv run alembic check` | **PASS (Up to date)** | Models and PostGIS schema migrations (revisions 01 through 09) in complete sync. |
| **Secret Pattern Audit** | `python3 scripts/secret_audit.py` | **PASS (0 findings)** | 9 revisions and all tracked working tree files scanned with zero leaked credentials. |
| **Deployment Smoke Probes** | `python -m scripts.deployment_smoke` | **PASS (5/5 probes)** | Liveness, readiness, PostGIS connectivity, capabilities, and provider status verified. |

---

## 2. Deployment Architecture: Option A (Vercel + Railway + PostGIS)

- **Frontend**: Next.js deployed on Vercel with HTTPS, security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options), and OpenFreeMap tile origin access.
- **Backend**: FastAPI deployed on Railway using Dockerfile (`apps/api/Dockerfile`), Python 3.13-slim, non-root user, single-worker Uvicorn ASGI server.
- **Database**: PostgreSQL 16 with PostGIS 3.4 (`postgis/postgis:16-3.4`) hosted on Railway with a persistent volume mounted at `/var/lib/postgresql/data`.
- **Colocation**: Backend and Database colocated within the same Railway region (e.g., Singapore) over a private service network.

---

## 3. Exact Human Steps to Complete Cloud Deployment

### Step A: Provision Railway Database & Backend
1. Log in to [Railway](https://railway.com) and create a new project.
2. Add a service using the `postgis/postgis:16-3.4` Docker image. Attach a persistent volume to `/var/lib/postgresql/data`.
3. Verify PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   SELECT PostGIS_Version();
   ```
4. Add a second service connected to this GitHub repository. Set:
   - **Root Directory**: `/apps/api`
   - **Config File**: `/railway.toml`
5. Set Railway Environment Variables:
   ```dotenv
   APP_ENV=production
   DEBUG=false
   ORCA_VERSION=0.1.0-hackathon
   FRONTEND_URL=https://<your-vercel-domain>.vercel.app
   CORS_ORIGINS=https://<your-vercel-domain>.vercel.app
   DATABASE_URL=postgresql+asyncpg://<railway-db-user>:<railway-db-pass>@<railway-db-host>:5432/<railway-db-name>
   JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
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
6. Deploy the Railway service. The predeploy hook automatically runs `alembic upgrade head`.

### Step B: Provision Vercel Frontend
1. Log in to [Vercel](https://vercel.com) and import the repository root.
2. Set Framework Preset: **Next.js**.
3. Configure Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`
4. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://<your-railway-api-domain>.up.railway.app`
5. Deploy to Vercel.

### Step C: Post-Deployment Smoke Verification
Run from your local terminal against the deployed cloud URLs:
```bash
cd apps/api
uv run python -m scripts.deployment_smoke \
  --api-url https://<your-railway-api-domain>.up.railway.app \
  --origin https://<your-vercel-domain>.vercel.app \
  --providers
```

---

## 4. Current Data Source Status & Provenance
- **Open-Meteo Weather**: LIVE / Active (public forecast endpoint).
- **Open-Meteo Marine**: LIVE / Active (wave, sea-surface temperature, ocean currents).
- **IMD CAP Alerts**: LIVE / Active (public RSS feed used by WMO Alert Hub).
- **INCOIS PFZ WFS**: LIVE / Active (official WebGIS WFS endpoint; requires periodic refresh).
- **INCOIS Alerts**: NOT_CONNECTED (no public unauthenticated structured feed).
- **SST & Chlorophyll Rasters**: DEMO DATA (historical demo samples; clearly labelled in UI and evidence).
- **Maritime Geofencing & Restricted Zones**: PARTIAL / DEMO DATA (spatial polygon engine active; official boundaries require approved gazetted datasets).
- **Route Optimization**: DEMO DATA (deterministic A* grid search active; environmental masks require high-resolution bathymetric/land rasters).

---

## 5. Security & Safety Posture
- **No LLM Risk Calculations**: Marine risk is computed 100% deterministically by `MarineRiskEngine`.
- **No Silent Fallback**: Live provider failures are surfaced as `UNAVAILABLE` or `PARTIAL`, never silently masked by demo data.
- **Fail-Closed Permissions**: Unrecognized areas or missing spatial clearance default to `UNAVAILABLE` rather than `CLEAR`.
- **Zero Secrets in Source**: Scanned with `scripts/secret_audit.py` across all Git history.
