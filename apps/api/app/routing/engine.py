import heapq,math
from dataclasses import dataclass
from typing import Iterable

@dataclass(frozen=True)
class RouteCell:
    row:int;column:int;latitude:float;longitude:float;navigable:bool=True;hard_restricted:bool=False;risk_cost:float=0;alert_cost:float=0;boundary_cost:float=0;current_cost:float=0;evidence_refs:tuple[str,...]=()
    @property
    def key(self):return self.row,self.column
    @property
    def penalty(self):return self.risk_cost+self.alert_cost+self.boundary_cost+self.current_cost
def haversine_km(a:tuple[float,float],b:tuple[float,float])->float:
    lat1,lon1=map(math.radians,a);lat2,lon2=map(math.radians,b);dlat=lat2-lat1;dlon=lon2-lon1
    value=math.sin(dlat/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 6371.0088*2*math.asin(math.sqrt(value))
class RouteEngine:
    """Deterministic 8-neighbour A*; hard constraints are never assigned a cost."""
    def __init__(self,distance_weight:float=1,risk_weight:float=5):self.distance_weight=distance_weight;self.risk_weight=risk_weight
    def solve(self,cells:Iterable[RouteCell],start:tuple[int,int],goal:tuple[int,int],mode:str="LOWEST_RISK")->list[RouteCell]|None:
        items={cell.key:cell for cell in cells}
        if start not in items or goal not in items:return None
        if any(not items[key].navigable or items[key].hard_restricted for key in (start,goal)):return None
        queue=[(0.0,start)];cost={start:0.0};previous={}
        while queue:
            _,current=heapq.heappop(queue)
            if current==goal:break
            cell=items[current]
            for dr,dc in ((-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)):
                key=(current[0]+dr,current[1]+dc);neighbor=items.get(key)
                if neighbor is None or not neighbor.navigable or neighbor.hard_restricted:continue
                distance=haversine_km((cell.latitude,cell.longitude),(neighbor.latitude,neighbor.longitude));penalty=0 if mode=="SHORTEST_FEASIBLE" else neighbor.penalty*(self.risk_weight if mode=="LOWEST_RISK" else 1)
                candidate=cost[current]+distance*self.distance_weight+penalty
                if candidate<cost.get(key,float("inf")):
                    cost[key]=candidate;previous[key]=current;heuristic=haversine_km((neighbor.latitude,neighbor.longitude),(items[goal].latitude,items[goal].longitude))*self.distance_weight;heapq.heappush(queue,(candidate+heuristic,key))
        if goal not in cost:return None
        path=[];key=goal
        while True:
            path.append(items[key])
            if key==start:break
            key=previous[key]
        return list(reversed(path))
