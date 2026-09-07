from app.orchestrator.agents import ORCAAgent,ToolAdapter,AGENT_NAMES
from app.planner.models import PlannerTool


class ORCAToolRegistry:
    """Fixed domain-tool registry; user plans cannot register adapters."""
    def __init__(self,adapters:dict[PlannerTool,ToolAdapter]|None=None)->None:self.adapters=adapters or {}
    def agent(self,tool:PlannerTool)->ORCAAgent:
        if not isinstance(tool, PlannerTool) or tool not in self.adapters: raise ValueError("TOOL_NOT_ALLOWED_OR_CONFIGURED")
        return ORCAAgent(AGENT_NAMES[tool],tool,self.adapters[tool])
