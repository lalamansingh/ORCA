from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Conversation

class ConversationRepository:
    def __init__(self, session: AsyncSession): self.session = session
    async def get(self, conversation_id: UUID) -> Conversation | None:
        return await self.session.get(Conversation, conversation_id)
    async def for_user(self, user_id: UUID) -> list[Conversation]:
        return list((await self.session.scalars(select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()))).all())
