.PHONY: dev demo test lint build system-check pre-demo-check migrate seed-demo audit
API_URL ?= http://localhost:8000
UV_CACHE_DIR ?= /tmp/orca-uv-cache
export UV_CACHE_DIR

dev:
	docker compose up --build

demo:
	ORCA_DEMO_MODE=true PFZ_PROVIDERS=demo ALERT_PROVIDERS=demo docker compose up --build -d
	$(MAKE) seed-demo

test:
	cd apps/api && uv run --frozen pytest -q
	npm test

lint:
	cd apps/api && uv run --frozen ruff check app scripts tests alembic
	npm run lint
	npm run typecheck

build:
	npm run build

migrate:
	cd apps/api && uv run --frozen alembic upgrade head

seed-demo:
	docker compose exec -e ORCA_DEMO_MODE=true backend .venv/bin/python -m scripts.seed_development

system-check:
	cd apps/api && uv run --frozen python -m scripts.deployment_smoke --api-url $(API_URL)

pre-demo-check: test lint
	$(MAKE) system-check

audit:
	python3 scripts/secret_audit.py
	npm audit --audit-level=high
	cd apps/api && uv run --frozen pip-audit
