# Judge demo — 5–7 minutes

This script follows current capabilities. The originally proposed seamless
multi-turn / streaming / live-route sequence is not implemented end-to-end.
Do not describe a demo fixture as an official/current advisory.

| Time | Action | What to explain |
|---|---|---|
| 0:00–0:40 | Open landing, sign into pre-created judging account | Fragmented marine information; ORCA coordinates context and evidence. Prototype for the ISRO problem context, no endorsement. |
| 0:40–1:20 | Open assistant, explicitly select Chennai sample location | Sample coordinate is not GPS. Ask “Show nearest PFZ”. |
| 1:20–2:10 | Inspect PFZ facts, provenance, evidence and completed agent activity | Advisory potential does not guarantee catch. Activity comes from returned execution results. |
| 2:10–3:00 | Dashboard: inspect Marine Operational Risk, select tomorrow morning | Deterministic risk, wave/wind factors, timestamps and missing data. Chat forecast text currently asks for this selector. |
| 3:00–3:40 | Show SST/chlorophyll and map layer legend | Explicit DEMO DATA, no claim of live satellite integration. |
| 3:40–4:20 | Ask “Is this area restricted?” at an explicit location | UNAVAILABLE means no clearance. Present prohibited-case automated evidence separately. |
| 4:20–5:00 | Route page: calculate demo geometry | Distances, unknown environmental assessment and route provenance remain visible. Live masks are not connected. |
| 5:00–5:40 | Ask “Recommend best PFZ” | ORCA operational ranking, not catch probability; no eligible result is a valid safety result. |
| 5:40–6:20 | Show Hindi/Hinglish localization test evidence and limits | Protected risk enums, numbers and distances remain invariant; full follow-up translation is partial. |
| 6:20–7:00 | End on evidence/map and architecture | LLM does not compute marine risk. Explain verified integrations and remaining source gaps. |

Secondary evidence demonstrations: run `uv run pytest -q tests/test_risk_engine.py
 tests/test_geofence_service.py tests/test_route_engine.py tests/test_pfz_ranking.py
 tests/test_localization.py tests/test_hardening.py` from apps/api (on one command line).
Use these deterministic tests to explain high-wave risk, prohibited PFZ exclusion,
hazard avoidance and preserved multilingual facts. They are tests, not live UI scenarios.
The illustrative 34 km/42 km route is not a measured route in this dataset.

If providers fail, keep unavailable states visible and use the explicit demo profile
for PFZ/alerts/route; cached local images and tests are the internet contingency.
No automatic live-to-demo replacement and no offline live-data claim.
