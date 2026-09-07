from fastapi import APIRouter,Depends,Request
from app.api.dependencies import get_current_user
from app.db.models import User
from app.routing.models import RouteRequest,RouteResult
from app.services.route_planning_service import RoutePlanningService

router=APIRouter(prefix="/routes")
@router.post("/calculate",response_model=RouteResult)
async def calculate_route(data:RouteRequest,request:Request,user:User=Depends(get_current_user)):
    settings=request.app.state.settings
    return await RoutePlanningService(demo_mode=settings.orca_demo_mode,grid_size=settings.route_grid_size,max_grid_cells=settings.route_max_grid_cells).calculate(data)
