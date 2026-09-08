# Testing

Run `make test`, `make lint`, `make build`. Backend lint checks fatal syntax and
undefined names; it intentionally does not reformat the codebase during release.
Frontend tests currently include source-contract and presentation tests; they do
not replace browser tests.

Use a disposable migrated PostgreSQL/PostGIS database for spatial tests:

```sh
cd apps/api
# Set APP_ENV=test, DATABASE_URL and a test-only JWT secret in private environment.
uv sync --frozen
uv run alembic upgrade head
uv run alembic check
ORCA_TEST_POSTGIS=true uv run pytest -q
```

Integration inserts a polygon, tests actual ST_Covers and geography distance,
then rolls back. Do not point this flag at production. CI requires this flag
and a PostGIS service container. Core tests use fixtures and no live providers.

Browser smoke tests:

```sh
npm ci
npx playwright install chromium
ORCA_WEB_URL=http://localhost:3000 npm run test:e2e
# Disposable demo only; creates an account and conversation:
ORCA_WEB_URL=http://localhost:3000 ORCA_E2E_DEMO=true npm run test:e2e
```

The in-app browser runtime could not initialize in the implementation environment;
standalone Playwright provides the fallback. Screenshots are local test artifacts,
not committed. Browser smoke coverage is narrower than the proposed full multilingual
multi-turn judging flow. Hosted tests remain unexecuted until URLs/accounts exist.

Critical existing suites: risk engine/input builder; geofence service; route engine;
PFZ ranking; localization; hardening; auth; LLM grounding; planner and reference
validation. Deployment regression tests cover fail-closed config/readiness and
cross-origin CSRF. `deployment_smoke` distinguishes transport results from data state.
