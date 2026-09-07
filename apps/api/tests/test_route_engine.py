from app.routing.engine import RouteCell,RouteEngine,haversine_km

def grid(size=5):return [RouteCell(r,c,10+r*.01,75+c*.01) for r in range(size) for c in range(size)]
def test_hard_constraint_is_never_crossed():
    cells=[RouteCell(cell.row,cell.column,cell.latitude,cell.longitude,hard_restricted=(cell.row==2 and cell.column==2)) for cell in grid()]
    path=RouteEngine().solve(cells,(0,2),(4,2))
    assert path and all(not cell.hard_restricted for cell in path)
def test_lowest_risk_prefers_longer_clear_path():
    cells=[RouteCell(cell.row,cell.column,cell.latitude,cell.longitude,risk_cost=50 if cell.column==2 and 0<cell.row<4 else 0) for cell in grid()]
    path=RouteEngine().solve(cells,(0,2),(4,2),"LOWEST_RISK")
    assert path and any(cell.column!=2 for cell in path[1:-1])
def test_no_path_when_goal_surrounded():
    cells=[RouteCell(cell.row,cell.column,cell.latitude,cell.longitude,hard_restricted=(cell.row,cell.column) in {(3,1),(3,2),(3,3),(4,1),(4,3)}) for cell in grid()]
    assert RouteEngine().solve(cells,(0,2),(4,2)) is None
def test_haversine_uses_geodesic_units():assert 110<haversine_km((0,0),(1,0))<112
