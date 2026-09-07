"""Authentication orchestration; route handlers only translate HTTP concerns."""
from datetime import UTC, datetime, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import Settings
from app.db.models import RefreshTokenSession, User
from app.repositories.auth_sessions import AuthSessionRepository
from app.repositories.users import UserRepository
from app.schemas.auth import UserLogin, UserProfileUpdate, UserRegister
from app.services.password_service import hash_password, verify_password
from app.services.token_service import create_access_token, create_refresh_token, decode_token, TokenError

class AuthenticationError(Exception): pass
class AccountExistsError(Exception): pass

class AuthService:
    def __init__(self,session:AsyncSession,settings:Settings): self.session,self.settings=session,settings; self.users=UserRepository(session); self.sessions=AuthSessionRepository(session)
    async def register(self,data:UserRegister,user_agent:str|None=None)->tuple[User,str,str]:
        if await self.users.by_email(data.email): raise AccountExistsError
        user=await self.users.add(User(email=data.email,full_name=data.full_name,password_hash=hash_password(data.password)))
        access,refresh=await self._issue_session(user,user_agent); await self.session.commit(); return user,access,refresh
    async def login(self,data:UserLogin,user_agent:str|None=None)->tuple[User,str,str]:
        user=await self.users.by_email(data.email)
        if user is None or not user.is_active or not verify_password(data.password,user.password_hash): raise AuthenticationError("Invalid email or password.")
        user.last_login_at=datetime.now(UTC); access,refresh=await self._issue_session(user,user_agent); await self.session.commit(); return user,access,refresh
    async def _issue_session(self,user:User,user_agent:str|None)->tuple[str,str]:
        access=create_access_token(user.id,self.settings); refresh,jti=create_refresh_token(user.id,self.settings)
        self.session.add(RefreshTokenSession(user_id=user.id,jti=jti,expires_at=datetime.now(UTC)+timedelta(days=self.settings.refresh_token_expire_days),user_agent=user_agent)); await self.session.flush(); return access,refresh
    async def refresh(self,token:str,user_agent:str|None=None)->tuple[User,str,str]:
        try: payload=decode_token(token,"refresh",self.settings)
        except TokenError as exc: raise AuthenticationError("Session is invalid or expired.") from exc
        session=await self.sessions.by_jti(str(payload["jti"])); user=await self.users.by_id(UUID(str(payload["sub"])))
        if session is None or session.revoked_at or session.expires_at <= datetime.now(UTC) or user is None or not user.is_active: raise AuthenticationError("Session is invalid or expired.")
        await self.sessions.revoke(session,datetime.now(UTC)); access,refresh=await self._issue_session(user,user_agent); await self.session.commit(); return user,access,refresh
    async def logout(self,token:str|None)->None:
        if token:
            try: payload=decode_token(token,"refresh",self.settings); session=await self.sessions.by_jti(str(payload["jti"]))
            except TokenError: session=None
            if session and session.revoked_at is None: await self.sessions.revoke(session,datetime.now(UTC)); await self.session.commit()
    async def update_profile(self,user:User,data:UserProfileUpdate)->User:
        for field,value in data.model_dump(exclude_unset=True).items(): setattr(user,field,value)
        await self.session.commit(); await self.session.refresh(user); return user
