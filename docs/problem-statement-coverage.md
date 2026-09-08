# ISRO problem-context coverage

This is a prototype built for the ISRO problem context, not an official ISRO service.
Status refers to actual integration; source availability is separate from unit tests.

| Requirement | ORCA capability | Implementation | Demo step | Status | Limitations |
|---|---|---|---|---|---|
| Nearest PFZ | Advisory ingestion + spatial proximity | PFZService / PFZ adapter / PostGIS | 2 | PARTIAL / DEMO | Live INCOIS needs current successful refresh; demo always labelled |
| Safe to venture? | Weather + marine + alerts + deterministic risk | RiskService / MarineRiskEngine | 3 | PARTIAL | Vessel calibration absent; future-time chat uses dashboard selector |
| Ocean conditions | Normalized forecasts | WeatherService / MarineWeatherService | 3 | INTEGRATED | Egress/provider availability must be checked per deployment |
| Cyclone/high-wave hazards | Normalized CAP advisories | AlertService | secondary | PARTIAL | IMD CAP configured; INCOIS alerts not connected |
| SST/chlorophyll | Point/layer context | OceanProductService | 4 | DEMO | No verified fresh live satellite product integration |
| Route optimization | Deterministic constrained A* | RouteEngine / RoutePlanningService | 6 | DEMO | Live land/environment masks absent; no live clearance |
| Hazard/legal zones | Point/zone checks | GeofenceService / PostGIS | 5 | PARTIAL | Authoritative spatial coverage absent; never infer permission from no data |
| PFZ ranking | Safety-first operational ranking | PFZRecommendationService / ranking engine | 7 | PARTIAL | Live enrichment can leave no eligible candidates; not catch probability |
| Multilingual | Protected facts / localization templates | LocalizationService, language dictionaries | 8 | PARTIAL | English/Hindi/Hinglish/Tamil protected-token tests; not full translated multi-turn UX |
| Collaborative agents | Allowlisted bounded service orchestration | QueryPlanner / ORCAOrchestrator | 2–7 | PARTIAL | LangGraph builder exists but persisted graph runtime is not connected |
| Multi-turn conversation | SQL conversation/message persistence | Conversation and Message models / chat endpoint | 2 | PARTIAL | Prior-turn reference resolution/checkpoints absent |
| Maps | Browser map, advisory layers, route geometry | MarineMap / MapLibre | 4–6 | PARTIAL | Full assistant map-action consumption absent; online basemap |
| Explainability | Source facts, timestamps, provenance, factors | Evidence schemas + text-only cards | all | INTEGRATED | Atomic response; no live progress/SSE |
| Reproducible deployment | Docker, migration job, CI and smoke scripts | Compose / Railway / GitHub Actions | pre-demo | LOCAL VERIFIED | Hosted URLs and remote CI execution require account access |

Roadmap only: verified government datasets, vessel calibration, more languages,
AIS, dynamic routing, mobile/PWA, voice, offline coastal workflows and historical
fisheries analytics. No speculative Step 21 work is included.
