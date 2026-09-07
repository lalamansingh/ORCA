# ORCA intent classification and query planner

Step 12 converts the validated Step 11 extraction into an auditable `ExecutionPlan`. `IntentClassifier` combines deterministic English/Hindi/Hinglish signals with the existing extraction; the rules remain authoritative for safety-sensitive routing. LLM output can assist classification in a future adapter, but it cannot add tools or facts.

The allowlist is `WEATHER`, `MARINE`, `ALERTS`, `RISK`, `PFZ`, `OCEAN_PRODUCTS`, `GEOSPATIAL`, and `MAP`. Dependencies are centralized in `QueryPlanner`: risk requires weather, marine, and alerts; PFZ distance requires PFZ then geospatial; PFZ safety adds target weather/marine/alerts before risk. Independent source steps are grouped for parallel execution. Plans contain typed `$context`/`$steps` references and no executable expressions.

Location precedence is explicit coordinates, selected/trusted location, then unresolved place text. A missing location creates a specific clarification request. Time is `CURRENT` unless preserved query wording indicates `FORECAST`; ambiguous wording remains a clarification. Route requests are classified but marked `NOT_IMPLEMENTED`. Informational questions such as “What is PFZ?” produce no provider steps.

`POST /api/v1/ai/plan` performs no tool calls. With AI disabled it uses deterministic fallback rules, so existing weather, marine, alerts, risk, PFZ, ocean-product, map, and auth APIs remain independent. The assistant development view shows language, intents, planned tools, dependency groups, clarification, and capability status; production users do not see internal planner JSON.
