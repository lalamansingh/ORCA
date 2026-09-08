# PFZ ranking and recommendations

ORCA ranks current official PFZ candidates for operational preference; it does
not predict fish, catch probability, species, or commercial yield. The pure
`PFZRankingEngine` receives normalized enriched candidates and performs no I/O.

Hard eligibility is evaluated before scoring: expired/invalid/out-of-domain PFZs,
prohibited targets, infeasible routes, extreme marine risk, and critical alerts
cannot become recommendations. Eligible candidates receive a 0–100 ORCA
recommendation score using safety/access (40%), smooth logarithmic distance
(20%), route feasibility (15%), data quality (10%), freshness (10%), and optional
ocean-product context (5%). SST and chlorophyll availability is context only and
is never interpreted as fish probability. Correlated risk and access signals are
capped through the worst safety component rather than independently stacked.

`POST /api/v1/pfz/recommendations` retrieves a bounded candidate set and enriches
the top candidates with existing risk, geofence, route, and ocean-product
services under a concurrency limit. Results include component scores, hard
exclusions, deterministic explanations, tradeoffs, evidence references, and
methodology version `orca-pfz-rank-v1`.
