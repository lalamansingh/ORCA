from datetime import UTC,datetime
from app.routing.engine import RouteCell,RouteEngine,haversine_km
from app.routing.models import RouteRequest,RouteResult,RouteSegment,RouteStatus

DISCLAIMER="Decision-support route only — verify official local navigation and maritime advisories before departure."
class RoutePlanningService:
    def __init__(self,demo_mode:bool=False,grid_size:int=11,max_grid_cells:int=2500):self.demo_mode=demo_mode;self.grid_size=grid_size;self.max_grid_cells=max_grid_cells
    async def calculate(self,request:RouteRequest)->RouteResult:
        direct=haversine_km((request.start.latitude,request.start.longitude),(request.destination.latitude,request.destination.longitude));now=datetime.now(UTC)
        base=dict(route_mode=request.route_mode,start=request.start,destination=request.destination,direct_distance_km=direct,departure_time=request.departure_time,generated_at=now,limitations=[DISCLAIMER])
        if not self.demo_mode:return RouteResult(status=RouteStatus.UNAVAILABLE,warnings=["LAND_MASK_NOT_CONNECTED","ROUTING_ENVIRONMENTAL_DATA_UNAVAILABLE"],**base)
        count=self.grid_size*self.grid_size
        if count>self.max_grid_cells:return RouteResult(status=RouteStatus.INSUFFICIENT_DATA,warnings=["ROUTE_COMPLEXITY_LIMIT"],**base)
        cells=[]
        for row in range(self.grid_size):
            fraction_row=row/(self.grid_size-1);lat=request.start.latitude+(request.destination.latitude-request.start.latitude)*fraction_row
            for column in range(self.grid_size):
                offset=(column-(self.grid_size-1)/2)*0.01;lon=request.start.longitude+(request.destination.longitude-request.start.longitude)*fraction_row+offset
                cells.append(RouteCell(row,column,lat,lon))
        middle=(self.grid_size-1)//2;path=RouteEngine().solve(cells,(0,middle),(self.grid_size-1,middle),request.route_mode.value)
        if not path:return RouteResult(status=RouteStatus.NO_FEASIBLE_ROUTE,warnings=["NO_ROUTE_AVAILABLE"],**base)
        coordinates=[[cell.longitude,cell.latitude] for cell in path];segments=[];total=0.0
        for index,(left,right) in enumerate(zip(path,path[1:])):
            distance=haversine_km((left.latitude,left.longitude),(right.latitude,right.longitude));total+=distance;segments.append(RouteSegment(index=index,geometry={"type":"LineString","coordinates":[[left.longitude,left.latitude],[right.longitude,right.latitude]]},distance_km=distance,cost=distance,geofence_status="UNKNOWN"))
        speed=request.vessel_profile.cruising_speed_knots if request.vessel_profile and request.vessel_profile.cruising_speed_knots else None
        return RouteResult(status=RouteStatus.DEMO,geometry={"type":"LineString","coordinates":coordinates},distance_km=total,detour_ratio=total/direct if direct else 1,estimated_duration_minutes=round(total/(speed*1.852)*60) if speed else None,route_segments=segments,warnings=["DEMO ROUTE: no authoritative land or environmental mask is connected."],evidence=[{"evidence_id":"route:model:orca-route-v1","source":"ORCA route engine","kind":"DERIVED"}],data_quality="INSUFFICIENT",**base)
