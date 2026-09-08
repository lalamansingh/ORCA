import logging
from secrets import token_urlsafe
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import csrf_protect, get_current_user
from app.core.config import Settings
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.auth import UserLogin, UserProfileUpdate, UserRead, UserRegister
from app.services.auth_service import AccountExistsError, AuthenticationError, AuthService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth")

@router.get("/csrf")
async def csrf_token(request: Request, response: Response):
    """Allow the configured frontend to read the API-host cookie token via CORS."""
    token = request.cookies.get("orca_csrf") or token_urlsafe(32)
    settings = request.app.state.settings
    response.headers["Cache-Control"] = "no-store"
    response.set_cookie("orca_csrf", token, httponly=True, secure=settings.cookie_secure, samesite=settings.cookie_samesite, path="/")
    return {"csrf_token": token}
def _set_cookies(response:Response,access:str,refresh:str,settings:Settings)->None:
    common={"httponly":True,"secure":settings.cookie_secure,"samesite":settings.cookie_samesite,"path":"/"}
    response.set_cookie("orca_access",access,max_age=settings.access_token_expire_minutes*60,**common)
    response.set_cookie("orca_refresh",refresh,max_age=settings.refresh_token_expire_days*86400,**common)
    response.set_cookie("orca_csrf",token_urlsafe(32),max_age=settings.refresh_token_expire_days*86400,httponly=False,secure=settings.cookie_secure,samesite=settings.cookie_samesite,path="/")
def _clear_cookies(response:Response,settings:Settings)->None:
    for name in ("orca_access","orca_refresh","orca_csrf"): response.delete_cookie(name,path="/",secure=settings.cookie_secure,samesite=settings.cookie_samesite)

@router.post("/register",response_model=UserRead,status_code=status.HTTP_201_CREATED)
async def register(data:UserRegister,request:Request,response:Response,session:AsyncSession=Depends(get_db_session))->User:
    try:
        user,access,refresh=await AuthService(session,request.app.state.settings).register(data,request.headers.get("user-agent"))
    except AccountExistsError as exc:
        raise HTTPException(status_code=409,detail="An account with this email already exists.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Registration failed: %s", exc, exc_info=True)
        err_msg = str(exc)
        if "connect" in err_msg.lower() or "connection" in err_msg.lower() or "refused" in err_msg.lower():
            raise HTTPException(status_code=503, detail="Database connection is not configured or offline. Please ensure DATABASE_URL is added to Railway Variables.") from exc
        raise HTTPException(status_code=500, detail=f"Registration failed: {err_msg}") from exc
    _set_cookies(response,access,refresh,request.app.state.settings); return user

@router.post("/login",response_model=UserRead)
async def login(data:UserLogin,request:Request,response:Response,session:AsyncSession=Depends(get_db_session))->User:
    try:
        user,access,refresh=await AuthService(session,request.app.state.settings).login(data,request.headers.get("user-agent"))
    except AuthenticationError as exc:
        raise HTTPException(status_code=401,detail="Invalid email or password.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Login failed: %s", exc, exc_info=True)
        err_msg = str(exc)
        if "connect" in err_msg.lower() or "connection" in err_msg.lower() or "refused" in err_msg.lower():
            raise HTTPException(status_code=503, detail="Database connection is not configured or offline. Please check DATABASE_URL in Railway.") from exc
        raise HTTPException(status_code=500, detail=f"Login failed: {err_msg}") from exc
    _set_cookies(response,access,refresh,request.app.state.settings); return user


@router.get("/me",response_model=UserRead)
async def me(user:User=Depends(get_current_user))->User: return user

@router.post("/refresh",response_model=UserRead,dependencies=[Depends(csrf_protect)])
async def refresh(request:Request,response:Response,refresh_token:str|None=Cookie(default=None,alias="orca_refresh"),session:AsyncSession=Depends(get_db_session))->User:
    if not refresh_token: raise HTTPException(status_code=401,detail="Session is invalid or expired.")
    try: user,access,refresh_token=await AuthService(session,request.app.state.settings).refresh(refresh_token,request.headers.get("user-agent"))
    except AuthenticationError as exc: raise HTTPException(status_code=401,detail="Session is invalid or expired.") from exc
    _set_cookies(response,access,refresh_token,request.app.state.settings); return user

@router.post("/logout",status_code=status.HTTP_204_NO_CONTENT,dependencies=[Depends(csrf_protect)])
async def logout(request:Request,response:Response,refresh_token:str|None=Cookie(default=None,alias="orca_refresh"),session:AsyncSession=Depends(get_db_session))->Response:
    await AuthService(session,request.app.state.settings).logout(refresh_token); _clear_cookies(response,request.app.state.settings); response.status_code=204; return response

@router.patch("/users/me",response_model=UserRead,dependencies=[Depends(csrf_protect)])
async def update_me(request:Request,data:UserProfileUpdate,user:User=Depends(get_current_user),session:AsyncSession=Depends(get_db_session))->User:
    return await AuthService(session,request.app.state.settings).update_profile(user,data)
