# ORCA system quality matrix

| Subsystem | Dependency | Primary failure | Safe fallback | Coverage | Security/observability | Demo | Status |
|---|---|---|---|---|---|---|---|
| Frontend shell/map | Next.js, MapLibre | API/map unavailable | explicit unavailable states | unit/build | CSP remains deployment work; request IDs | labelled fixtures | YELLOW |
| API | FastAPI | invalid/large/abusive request | typed error, size/rate limit | API tests | request ID, duration, metrics | supported | GREEN |
| Database/PostGIS | PostgreSQL/PostGIS | connection/source unavailable | readiness degraded | repository/API | ORM parameters, spatial bounds | seeded data | YELLOW |
| Authentication | JWT cookies, Argon2 | invalid/expired session | 401 + rotation/revocation | auth tests | HttpOnly, CSRF, configurable Secure/SameSite, rate limit | local accounts | GREEN |
| Weather/marine | Open-Meteo | timeout/invalid payload | unavailable, never zero | provider/service tests | bounded retries, provider logs | explicit provider only | GREEN |
| Alerts | IMD/INCOIS | feed failure | provider unavailable distinct from none | API/service tests | bounded parsing and radius | scenario registry | GREEN |
| PFZ | INCOIS WFS | unavailable/stale advisory | distinct unavailable/no-current | provider/API tests | bounded feature count/radius | explicit demo provider | GREEN |
| Ocean products | demo provider | real source absent | DEMO label | unit/frontend | no user URL fetching | deterministic | YELLOW |
| Risk engine | normalized facts | missing critical inputs | UNAVAILABLE/limited quality | deterministic unit/API | no LLM authority | deterministic | GREEN |
| Geofence | PostGIS zones | authoritative geometry absent | UNAVAILABLE, never CLEAR | service tests | parameterized spatial queries | labelled geometry | YELLOW |
| Routing | land/environment masks | masks absent/no path | UNAVAILABLE/no route | A* golden tests | hard constraints, bounded grid | explicit DEMO | YELLOW |
| PFZ ranking | enrichment services | partial critical data | partial/no eligible | deterministic ranking tests | bounded top-N/concurrency | methodology-labelled | GREEN |
| LLM/planner | configured provider | invalid/disabled output | deterministic extraction/planning | unit/API/injection tests | allowlisted tools, numeric/evidence checks | mock provider | GREEN |
| Orchestrator/chat | LangGraph, DB | tool/stream failure | partial/blocked result | orchestration/API | safe references, ownership check | supported | YELLOW |
| Localization | dictionaries/LLM | localization failure | English/templates | protected-token tests | canonical enums/facts | deterministic | GREEN |
| Observability | logs/metrics | process-local metric reset | structured request logs | unit/API pending expansion | secrets/query bodies excluded | same events | YELLOW |

## Remaining release risks

- Live land-mask and authoritative legal geometry sources are not connected, so
  geofence and route features correctly fail closed outside explicit demo mode.
- In-memory rate limiting and metrics are per process; deployment should replace
  them with shared infrastructure when horizontally scaled.
- A live exploit-validation scan was not run in this pass because no staging URL
  or disposable test accounts were supplied. Code and automated security tests
  do not prove black-box exploitability.
- Full browser E2E, streaming interruption recovery, database migration tests on
  populated PostGIS, and accessibility testing with assistive technology remain
  YELLOW before production deployment.
