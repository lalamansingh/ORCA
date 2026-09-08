# Presentation narrative

1. **Problem.** Marine users interpret disconnected weather, advisories, fishery and
spatial sources under time pressure. ORCA coordinates that context into one
question-and-evidence workflow; it does not replace the source authorities.
2. **Fragmentation.** A nearby PFZ says nothing by itself about wave exposure,
restrictions or source freshness. Explain why those are separate facts.
3. **Architecture.** Next.js → FastAPI → allowlisted planner → bounded specialized
services → deterministic risk/geospatial/ranking rules → evidence. SQL stores
accounts and conversations. Distinguish intended LangGraph persistence from the
currently connected orchestrator; show the actual architecture document.
4. **Demonstration.** Follow demo-script.md. Explicitly label fixtures, show missing
inputs and avoid unsupported cross-turn or streaming claims.
5. **Safety and explainability.** LLM does not determine marine risk. Every displayed
recommendation should show what, why, source and validity time. LOW is not maritime
clearance; PROHIBITED is not overridden by favorable waves or a persuasive query.
6. **Scale and roadmap.** More verified official datasets, vessel-specific validation,
languages, AIS, dynamic routes, mobile/voice and offline coastal tools. These are
future work, not capabilities claimed in the current release.

Closing statement supported by the current build: ORCA can classify a marine
question, call specialized services and show structured evidence with deterministic
risk rules. The complete contextual multi-turn/map recommendation experience is
partial. Discuss that boundary candidly with technical judges.
