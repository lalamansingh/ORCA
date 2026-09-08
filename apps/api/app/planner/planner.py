from datetime import UTC,datetime
from uuid import uuid4
from app.llm.models import QueryExtractionResult
from app.planner.intent import classify
from app.planner.models import *
from app.planner.validator import validate_plan


class QueryPlanner:
    def plan(self, extraction:QueryExtractionResult, selected_location:dict|None=None)->ExecutionPlan:
        classification=classify(extraction); location={"latitude":extraction.latitude,"longitude":extraction.longitude,"source":"explicit_query"} if extraction.latitude is not None else selected_location
        intents=set(classification.secondary_intents or [classification.primary_intent]); text=extraction.raw_query.lower(); steps:list[PlanStep]=[]
        def add(id:str,tool:PlannerTool,operation:str,reason:str,depends:list[str]=[],inputs:dict|None=None,required=True,parallel=False,status=PlanStepStatus.PENDING):steps.append(PlanStep(id=id,tool=tool,operation=operation,reason_code=reason,depends_on=depends,inputs=inputs or {},required=required,parallelizable=parallel,status=status))
        risk=classification.safety_sensitive or PlannerIntent.MARINE_RISK_QUERY in intents
        pfz=PlannerIntent.PFZ_QUERY in intents
        recommendation=PlannerIntent.PFZ_RECOMMENDATION_QUERY in intents
        if recommendation:add("pfz_recommendation",PlannerTool.PFZ_RECOMMENDATION,"recommend","REQUESTED_PFZ_RECOMMENDATION",inputs={"location_ref":"$context.user_location"})
        if risk:
            add("weather",PlannerTool.WEATHER,"forecast","REQUIRED_FOR_MARINE_RISK",parallel=True);add("marine",PlannerTool.MARINE,"forecast","REQUIRED_FOR_MARINE_RISK",parallel=True);add("alerts",PlannerTool.ALERTS,"active","REQUIRED_FOR_ALERT_RELEVANCE",parallel=True)
            add("risk",PlannerTool.RISK,"evaluate","REQUIRED_FOR_MARINE_RISK",["weather","marine","alerts"],{"location_ref":"$context.user_location"})
        elif PlannerIntent.WEATHER_QUERY in intents:add("weather",PlannerTool.WEATHER,"forecast","REQUESTED_WEATHER",parallel=True)
        if pfz:
            add("pfz",PlannerTool.PFZ,"nearest","REQUIRED_FOR_PFZ_DISTANCE",inputs={"location_ref":"$context.user_location"},parallel=True)
            add("geospatial",PlannerTool.GEOSPATIAL,"nearest_geometry","REQUIRED_FOR_PFZ_DISTANCE",["pfz"],{"target_ref":"$steps.pfz.pfzs.0.nearest_point"})
        if PlannerIntent.MARINE_CONDITIONS_QUERY in intents and not risk:add("marine",PlannerTool.MARINE,"forecast","REQUESTED_MARINE_CONDITIONS",parallel=True,inputs={"location_ref":"$context.user_location"})
        if PlannerIntent.ALERT_QUERY in intents and not risk:add("alerts",PlannerTool.ALERTS,"active","REQUESTED_ALERTS",parallel=True)
        if PlannerIntent.OCEAN_PRODUCTIVITY_QUERY in intents:add("ocean_products",PlannerTool.OCEAN_PRODUCTS,"sample","REQUESTED_OCEAN_PRODUCTS",parallel=True)
        if PlannerIntent.GEOFENCE_QUERY in intents:add("geofence",PlannerTool.GEOFENCE,"check_point","REQUESTED_GEOFENCE_CHECK",inputs={"location_ref":"$context.user_location"},parallel=True)
        if PlannerIntent.MAP_QUERY in intents:add("map",PlannerTool.MAP,"display","REQUESTED_MAP_DISPLAY",["pfz"] if pfz else [],required=False,parallel=False)
        capability=CapabilityStatus.AVAILABLE
        if PlannerIntent.ROUTE_QUERY in intents:add("route",PlannerTool.ROUTE,"calculate","REQUESTED_SAFE_ROUTE",["geospatial"] if pfz else [],{"start":"$context.user_location","destination":"$steps.pfz.pfzs.0.nearest_point"} if pfz else {"start":"$context.user_location"})
        if pfz and risk:
            by_id={step.id:step for step in steps}
            by_id["geospatial"].depends_on=["pfz"]
            for identifier in ("weather","marine","alerts"):
                by_id[identifier].depends_on=["geospatial"]
                by_id[identifier].inputs["location_ref"]="$steps.pfz.pfzs.0.nearest_point"
            by_id["risk"].depends_on=["weather","marine","alerts"]
            by_id["risk"].inputs["location_ref"]="$steps.pfz.pfzs.0.nearest_point"
            steps=[by_id[identifier] for identifier in ("pfz","geospatial","weather","marine","alerts","risk")]+[step for step in steps if step.id not in {"pfz","geospatial","weather","marine","alerts","risk"}]
        clarifications=[]
        needs_location=bool(extraction.requires_location or risk or pfz or recommendation or any(step.tool in {PlannerTool.WEATHER,PlannerTool.MARINE,PlannerTool.ALERTS,PlannerTool.RISK,PlannerTool.GEOSPATIAL,PlannerTool.GEOFENCE} for step in steps))
        if needs_location and location is None:clarifications.append(ClarificationRequest(type=ClarificationType.MISSING_LOCATION,question="Which coastal location or coordinates should ORCA assess?",required_field="location"))
        if extraction.needs_clarification and extraction.requested_time_text:clarifications.append(ClarificationRequest(type=ClarificationType.AMBIGUOUS_TIME,question="What exact time should ORCA use?",required_field="requested_time"))
        if PlannerIntent.ROUTE_QUERY in intents and not pfz:clarifications.append(ClarificationRequest(type=ClarificationType.AMBIGUOUS_TARGET,question="Which structured marine destination should ORCA route to?",required_field="destination"))
        for step in steps:step.inputs.setdefault("location",location) if location else None
        groups=[];parallel=[step.id for step in steps if step.parallelizable];
        if parallel:groups.append(parallel)
        for step in steps:
            if step.depends_on:groups.append([step.id])
        plan=ExecutionPlan(query_id=uuid4(),primary_intent=classification.primary_intent,secondary_intents=classification.secondary_intents,requires_location=needs_location,location=location,requested_time=extraction.requested_time_text,time_mode="FORECAST" if extraction.requested_time_text else "CURRENT",steps=steps,parallel_groups=groups,dependencies={step.id:step.depends_on for step in steps},needs_clarification=bool(clarifications),clarification_requests=clarifications,clarification_questions=[item.question for item in clarifications],estimated_tool_calls=sum(step.required for step in steps),safety_sensitive=classification.safety_sensitive,response_language=extraction.language.language_code,capability_status=capability,classification=classification,metadata={"planner_version":"orca-planner-v1","llm_executed_tools":False})
        return validate_plan(plan)
