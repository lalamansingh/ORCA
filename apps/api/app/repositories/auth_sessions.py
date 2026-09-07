from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import RefreshTokenSession
class AuthSessionRepository:
    def __init__(self,session:AsyncSession): self.session=session
    async def by_jti(self,jti:str)->RefreshTokenSession|None: return await self.session.scalar(select(RefreshTokenSession).where(RefreshTokenSession.jti==jti))
    async def revoke(self,session:RefreshTokenSession,when:datetime)->None: session.revoked_at=when; await self.session.flush()
