# Production Deployment Orchestration Guide

## Multi-Cloud Topography
- **Edge UI**: Next.js 16 deployed on Vercel Edge CDN with global asset caching.
- **Core API**: FastAPI async ASGI server running in Docker on Railway.
- **Spatial DB**: PostgreSQL 16 + PostGIS 3.4 persistent volume.
- **Monitoring**: Health check probes at `/api/v1/health/ready`.
