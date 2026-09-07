from datetime import UTC,datetime
from typing import Any
from langgraph.graph import END,START,StateGraph
from app.orchestrator.models import ORCAState


def build_orca_graph(executor:Any):
    async def execute(state:ORCAState)->dict[str,Any]: return await executor.execute_state(state)
    graph=StateGraph(ORCAState);graph.add_node("execute_plan",execute);graph.add_edge(START,"execute_plan");graph.add_edge("execute_plan",END);return graph.compile()
