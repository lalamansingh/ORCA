import time
from datetime import UTC,datetime
from typing import Any, Awaitable, Callable
from app.orchestrator.models import AgentResult,AgentStatus
from app.planner.models import PlanStep,PlannerTool

ToolAdapter=Callable[[PlanStep,dict[str,Any],dict[str,dict[str,Any]]],Awaitable[dict[str,Any]]]


class ORCAAgent:
    def __init__(self,name:str,tool:PlannerTool,adapter:ToolAdapter):self.name,self.tool,self.adapter=name,tool,adapter
    async def run(self,step:PlanStep,context:dict[str,Any],steps:dict[str,dict[str,Any]])->AgentResult:
        started=datetime.now(UTC);clock=time.perf_counter()
        try:
            data=await self.adapter(step,context,steps)
            evidence=list(data.pop("evidence",[])) if isinstance(data,dict) else []
            return AgentResult(agent=self.name,step_id=step.id,status=AgentStatus.SUCCESS,data=data,evidence=evidence,started_at=started,completed_at=datetime.now(UTC),duration_ms=(time.perf_counter()-clock)*1000)
        except Exception as exc:
            return AgentResult(agent=self.name,step_id=step.id,status=AgentStatus.FAILED,errors=[{"code":type(exc).__name__,"message":"Approved ORCA service failed."}],started_at=started,completed_at=datetime.now(UTC),duration_ms=(time.perf_counter()-clock)*1000)


AGENT_NAMES={PlannerTool.WEATHER:"WeatherAgent",PlannerTool.MARINE:"MarineAgent",PlannerTool.ALERTS:"AlertAgent",PlannerTool.RISK:"RiskAgent",PlannerTool.PFZ:"PFZAgent",PlannerTool.OCEAN_PRODUCTS:"OceanProductAgent",PlannerTool.GEOSPATIAL:"GeospatialAgent",PlannerTool.MAP:"MapActionAgent"}
