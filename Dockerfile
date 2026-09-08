FROM ghcr.io/astral-sh/uv:0.8.22 AS uv
FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PORT=8000
WORKDIR /app
COPY --from=uv /uv /uvx /bin/
COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY apps/api/alembic.ini ./
COPY apps/api/alembic ./alembic
COPY apps/api/app ./app
COPY apps/api/scripts ./scripts
RUN addgroup --system orca && adduser --system --ingroup orca orca && chown -R orca:orca /app
USER orca
EXPOSE 8000
CMD ["sh","-c",".venv/bin/alembic upgrade head || true; exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers ${WEB_CONCURRENCY:-1}"]


