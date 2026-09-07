# ORCA agents

Weather, Marine, Alert, Risk, PFZ, OceanProduct, Geospatial, and Map agents are
thin adapters over existing deterministic services. Evidence is aggregated by
the orchestrator from provider-backed results. No agent may execute shell
commands, arbitrary URLs, raw SQL, or invent observations; provider failures are
returned as partial, traceable results.
