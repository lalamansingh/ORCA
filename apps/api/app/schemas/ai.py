from pydantic import BaseModel,Field
from uuid import UUID


class QueryInput(BaseModel):
    query:str=Field(min_length=1,max_length=8000)

class ExecuteInput(QueryInput):
    selected_location: dict|None = None

class ConversationMessageInput(QueryInput):
    conversation_id: UUID|None = None
    selected_location: dict|None = None
