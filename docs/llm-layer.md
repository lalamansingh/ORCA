# ORCA language layer

Step 11 adds a provider-independent LLM boundary for query language extraction and fact-only response formatting. `QueryUnderstandingService` returns validated Pydantic structures for language, explicit coordinates, preserved time wording, entities, preliminary intents, ambiguities, and future tool needs. It never geocodes, calls marine services, calculates risk, or produces environmental values.

`AIResponseService` accepts only `ORCAFactContext`, whose evidence references originate in ORCA services. Unsupported evidence references and unsupported numeric claims are rejected. The centralized system prompt prohibits fabricated measurements, advisories, coordinates, source URLs, and unsafe claims; prompt injection is treated as untrusted user text. Chain-of-thought is neither requested nor stored.

`LLM_ENABLED=false` is the default and returns a controlled `AI_UNAVAILABLE` response while weather, marine, alerts, risk, PFZ, and ocean products continue to operate. `LLM_PROVIDER=mock` provides deterministic offline extraction for tests. The OpenAI adapter runs only server-side, uses `OPENAI_API_KEY`, configured model/timeout/retries/temperature, structured JSON schema output, and safe metadata logging without prompts or secrets.

The development endpoint is `POST /api/v1/ai/extract-query` with `{ "query": "..." }`. Input and output limits are configured; production applications should add authenticated per-user rate limiting before exposing generation endpoints. Place names remain text because geocoding belongs to a later tool/planner step.
