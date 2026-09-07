import asyncio
import logging
import time
from typing import Any
from datetime import UTC,datetime
from uuid import UUID,uuid4
from app.orchestrator.graph import build_orca_graph
from app.orchestrator.models import AgentResult,AgentStatus,MapAction,ORCAState,OrchestrationError,OrchestrationResult,OrchestrationStatus
from app.orchestrator.reference import PlanReferenceResolver
from app.orchestrator.registry import ORCAToolRegistry
from app.planner.models import ExecutionPlan,PlanStepStatus
from app.planner.validator import validate_plan

logger=logging.getLogger(__name__)


class ORCAOrchestrator:
    def __init__(self,registry:ORCAToolRegistry,max_parallel:int=3,timeout_seconds:float=45)->None:self.registry,self.max_parallel,self.timeout=registry,max_parallel,timeout_seconds
    async def execute(self,plan:ExecutionPlan,raw_query:str="",selected_location:dict|None=None)->OrchestrationResult:
        validate_plan(plan)
        started=datetime.now(UTC);clock=time.perf_counter();trace_id=str(uuid4())
        if plan.needs_clarification:return OrchestrationResult(query_id=plan.query_id,trace_id=trace_id,status=OrchestrationStatus.NEEDS_CLARIFICATION,intent=plan.primary_intent,location=plan.location,requested_time=plan.requested_time,warnings=list(plan.clarification_questions),started_at=started,completed_at=datetime.now(UTC),duration_ms=(time.perf_counter()-clock)*1000)
        if plan.capability_status.value=="NOT_IMPLEMENTED":return OrchestrationResult(query_id=plan.query_id,trace_id=trace_id,status=OrchestrationStatus.UNSUPPORTED,intent=plan.primary_intent,location=plan.location,requested_time=plan.requested_time,started_at=started,completed_at=datetime.now(UTC),duration_ms=(time.perf_counter()-clock)*1000,warnings=["Requested capability is not implemented."])
        state:ORCAState={"query_id":str(plan.query_id),"trace_id":trace_id,"raw_query":raw_query,"execution_plan":plan.model_dump(mode="json"),"selected_location":selected_location or plan.location,"requested_time":plan.requested_time,"step_results":{},"evidence":[],"errors":[],"warnings":[],"map_actions":[]}
        try: state=await asyncio.wait_for(self._run(state,plan),timeout=self.timeout)
        except asyncio.TimeoutError:state["errors"].append({"code":"ORCHESTRATION_TIMEOUT","message":"Orchestration time budget exceeded."});state["execution_status"]="PARTIAL"
        results=[AgentResult.model_validate(item) for item in state.get("step_results",{}).values()]
        errors=[OrchestrationError(step_id=item.step_id,agent=item.agent,code=error.get("code","AGENT_FAILED"),message=error.get("message","Approved service failed.")) for item in results for error in item.errors]
        result_status=OrchestrationStatus.SUCCESS if not errors else OrchestrationStatus.PARTIAL
        return OrchestrationResult(query_id=plan.query_id,trace_id=trace_id,status=result_status,intent=plan.primary_intent,location=state.get("selected_location"),requested_time=plan.requested_time,data={key:value for key,value in state.items() if key in {"weather","marine","alerts","risk","pfz","ocean_products","geospatial","geofence","route"}},evidence=state.get("evidence",[]),step_results=results,warnings=state.get("warnings",[]),errors=errors,map_actions=[MapAction.model_validate(action) for action in state.get("map_actions",[])],started_at=started,completed_at=datetime.now(UTC),duration_ms=(time.perf_counter()-clock)*1000)
    async def _run(self,state:ORCAState,plan:ExecutionPlan)->ORCAState:
        pending={step.id:step for step in plan.steps};completed:set[str]=set();failed:set[str]=set()
        while pending:
            ready=[step for step in pending.values() if set(step.depends_on)<=completed]
            blocked=[step for step in pending.values() if set(step.depends_on)&failed]
            for step in blocked:
                state["step_results"][step.id]=AgentResult(agent="ORCA",step_id=step.id,status=AgentStatus.BLOCKED,data={},errors=[{"code":"DEPENDENCY_FAILED","message":"Required dependency failed."}],started_at=datetime.now(UTC),completed_at=datetime.now(UTC),duration_ms=0).model_dump(mode="json");del pending[step.id];failed.add(step.id)
            if not ready:
                if pending: raise ValueError("PLAN_DEPENDENCY_STALLED")
                break
            for offset in range(0,len(ready),self.max_parallel):
                batch=ready[offset:offset+self.max_parallel]
                results=await asyncio.gather(*(self._run_step(step,state) for step in batch))
                for step,result in zip(batch,results,strict=True):
                    state["step_results"][step.id]=result.model_dump(mode="json");
                    if result.status==AgentStatus.SUCCESS:
                        state[step.tool.value.lower()]=result.data;completed.add(step.id)
                        state["evidence"].extend(result.evidence)
                    else:failed.add(step.id);state["errors"].extend(result.errors)
                    del pending[step.id]
        # Stable evidence IDs and de-duplication are deterministic.
        unique={str(item.get("evidence_id")):item for item in state.get("evidence",[]) if item.get("evidence_id")}
        state["evidence"]=list(unique.values());state["execution_status"]="SUCCESS" if not failed else "PARTIAL";return state
    async def _run_step(self,step:Any,state:ORCAState)->AgentResult:
        context={"user_location":state.get("selected_location"),"requested_time":state.get("requested_time")};resolver=PlanReferenceResolver(context,state.get("step_results",{}))
        try:
            inputs={key:resolver.resolve(value) for key,value in step.inputs.items()}
            return await self.registry.agent(step.tool).run(step,inputs,state.get("step_results",{}))
        except Exception as exc:
            now=datetime.now(UTC);return AgentResult(agent="ORCA",step_id=step.id,status=AgentStatus.FAILED,errors=[{"code":str(exc),"message":"Plan step could not be executed safely."}],started_at=now,completed_at=now,duration_ms=0)


async def execute_plan(registry:ORCAToolRegistry,plan:ExecutionPlan,raw_query:str="",selected_location:dict|None=None,max_parallel:int=3,timeout_seconds:float=45)->OrchestrationResult:
    return await ORCAOrchestrator(registry,max_parallel,timeout_seconds).execute(plan,raw_query,selected_location)
