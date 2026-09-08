from datetime import UTC,datetime
from pydantic import BaseModel,Field

DEMO_REFERENCE_TIME=datetime(2026,1,15,6,tzinfo=UTC)
class DemoScenario(BaseModel):
    id:str;name:str;description:str;origin:dict[str,float];expected:list[str]=Field(default_factory=list)
DEMO_SCENARIOS=(
 DemoScenario(id="safe-pfz",name="Safe-ish PFZ",description="Current demo PFZ with moderate operational conditions.",origin={"latitude":13.08,"longitude":80.27},expected=["PFZ_AVAILABLE"]),
 DemoScenario(id="high-wave",name="High-wave risk",description="High waves produce HIGH marine risk.",origin={"latitude":13.08,"longitude":80.27},expected=["HIGH"]),
 DemoScenario(id="cyclone-alert",name="Cyclone alert",description="Severe cyclone advisory remains visible.",origin={"latitude":13.08,"longitude":80.27},expected=["SEVERE"]),
 DemoScenario(id="restricted-pfz",name="Restricted PFZ",description="PFZ remains visible but is excluded from recommendation.",origin={"latitude":13.08,"longitude":80.27},expected=["PROHIBITED"]),
 DemoScenario(id="route-detour",name="Route detour",description="Lower-risk route avoids a hard hazard cell.",origin={"latitude":13.08,"longitude":80.27},expected=["DETOUR"]),
 DemoScenario(id="no-route",name="No feasible route",description="Hard constraints surround the destination.",origin={"latitude":13.08,"longitude":80.27},expected=["NO_FEASIBLE_ROUTE"]),
 DemoScenario(id="pfz-ranking",name="PFZ comparison",description="Several deterministic candidates demonstrate safety-first ranking.",origin={"latitude":13.08,"longitude":80.27},expected=["orca-pfz-rank-v1"]),
 DemoScenario(id="partial-provider",name="Partial provider failure",description="Marine input unavailable while other sources remain available.",origin={"latitude":13.08,"longitude":80.27},expected=["DEGRADED"]),
)
class DemoScenarioRegistry:
    def list(self):return list(DEMO_SCENARIOS)
    def get(self,scenario_id:str):return next((item for item in DEMO_SCENARIOS if item.id==scenario_id),None)
