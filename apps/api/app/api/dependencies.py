"""Reusable authentication dependencies."""
from uuid import UUID
from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import Settings
from app.db.models import User
from app.db.session import get_db_session
from app.repositories.users import UserRepository
from app.services.token_service import TokenError, decode_token

async def get_current_user(request:Request,access_token:str|None=Cookie(default=None,alias="orca_access"),session:AsyncSession=Depends(get_db_session))->User:
    if not access_token: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Authentication required.")
    try: payload=decode_token(access_token,"access",request.app.state.settings)
    except TokenError as exc: raise HTTPException(status_code=401,detail="Authentication required.") from exc
    user=await UserRepository(session).by_id(UUID(str(payload["sub"])))
    if user is None or not user.is_active: raise HTTPException(status_code=401,detail="Authentication required.")
    return user

async def get_current_user_optional(request:Request,access_token:str|None=Cookie(default=None,alias="orca_access"),session:AsyncSession=Depends(get_db_session))->User|None:
    if not access_token: return None
    try: payload=decode_token(access_token,"access",request.app.state.settings)
    except TokenError: return None
    try:
        user=await UserRepository(session).by_id(UUID(str(payload["sub"])))
        return user if user and user.is_active else None
    except Exception: return None

def csrf_protect(request:Request,csrf_cookie:str|None=Cookie(default=None,alias="orca_csrf"))->None:
    if not csrf_cookie or request.headers.get("X-CSRF-Token") != csrf_cookie: raise HTTPException(status_code=403,detail="CSRF validation failed.")


