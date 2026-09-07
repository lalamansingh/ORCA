from typing import Any


class PlanReferenceResolver:
    """Resolves only explicit context/step references; never evaluates Python."""
    def __init__(self, context: dict[str,Any], steps: dict[str,dict[str,Any]]) -> None: self.context,self.steps=context,steps
    def resolve(self, value: Any) -> Any:
        if not isinstance(value,str) or not value.startswith("$"): return value
        parts=value[1:].split(".")
        if not parts or parts[0] not in {"context","steps"}: raise ValueError("PLAN_REFERENCE_INVALID")
        current: Any=self.context if parts[0]=="context" else self.steps
        for part in parts[1:]:
            if isinstance(current,dict) and "data" in current and part not in current: current=current["data"]
            if not part or part.startswith("_") or not isinstance(current,dict) or part not in current: raise ValueError("PLAN_REFERENCE_UNAVAILABLE")
            current=current[part]
        return current
