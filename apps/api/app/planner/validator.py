from app.planner.models import ExecutionPlan,PlannerTool,PlannerIntent


def validate_plan(plan: ExecutionPlan) -> ExecutionPlan:
    ids={step.id for step in plan.steps}
    if len(ids)!=len(plan.steps) or any(dep not in ids for step in plan.steps for dep in step.depends_on): raise ValueError("PLAN_INVALID_DEPENDENCY")
    visiting:set[str]=set(); visited:set[str]=set()
    def visit(node:str)->None:
        if node in visiting: raise ValueError("PLAN_CIRCULAR_DEPENDENCY")
        if node in visited:return
        visiting.add(node)
        for dep in next(step for step in plan.steps if step.id==node).depends_on:visit(dep)
        visiting.remove(node);visited.add(node)
    for node in ids:visit(node)
    if plan.safety_sensitive and plan.primary_intent in {PlannerIntent.MARINE_RISK_QUERY,PlannerIntent.MULTI_INTENT}:
        tools={step.tool for step in plan.steps}
        if PlannerTool.RISK not in tools or not {PlannerTool.WEATHER,PlannerTool.MARINE,PlannerTool.ALERTS}.issubset(tools):raise ValueError("PLAN_INVALID_SAFETY_DEPENDENCIES")
    if plan.estimated_tool_calls>8:raise ValueError("PLAN_TOOL_CALL_LIMIT")
    return plan
