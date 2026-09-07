# ORCA orchestration

Step 13 executes a validated `ExecutionPlan` through a compiled LangGraph state
graph. The graph has a single deterministic scheduler node: dependency-ready
domain agents run concurrently within a bounded pool, while dependent steps are
blocked after failures. Agents can call only adapters registered for the
`PlannerTool` allowlist; plans and references are validated without `eval`.

`POST /api/v1/ai/execute` runs query understanding (with deterministic fallback
when LLMs are disabled), planning, and execution. Responses include a trace ID,
per-agent statuses, bounded errors, deduplicated evidence, and map actions.
Clarification and unsupported plans return explicit statuses and do not execute
tools. This layer stops at structured facts; conversational response drafting
belongs to a later step.
