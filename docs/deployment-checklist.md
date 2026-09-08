# Release checklist

Only check a box after verifying the target release/environment.

- [ ] Main-branch CI green: Python lint/tests, real PostGIS tests, Alembic check, frontend lint/tests/typecheck/build.
- [ ] Secret pattern scan and dependency audits reviewed; production secrets unique and private.
- [ ] Railway PostGIS image/version reviewed; persistent volume and transport configured.
- [ ] SELECT PostGIS_Version() succeeds; backup restored into a separate test database.
- [ ] Backend/DB colocated; one replica/worker; pool and operation limits appropriate.
- [ ] API root /apps/api, config /railway.toml; single predeploy migration succeeds.
- [ ] /api/v1/health/live = 200; /api/v1/health/ready = 200 with PostGIS true.
- [ ] Exact frontend CORS origin; Secure/SameSite policy tested in judging browser.
- [ ] Vercel NEXT_PUBLIC_API_URL correct; HTTPS frontend serves 200 and map assets load.
- [ ] Register, login, reload, profile change, refresh, logout and expiry tested.
- [ ] Provider freshness/provenance checked; demo fixtures never described as LIVE.
- [ ] PFZ request, risk, geofence, route and ranking states inspected.
- [ ] Unavailable live routing and absent checkpoint/SSE features disclosed.
- [ ] Demo account/scenario prepared; local contingency and backup ready.
- [ ] Hosted URLs and results recorded in hosted-validation.md.
