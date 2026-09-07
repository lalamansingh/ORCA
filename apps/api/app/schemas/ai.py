from pydantic import BaseModel,Field


class QueryInput(BaseModel):
    query:str=Field(min_length=1,max_length=8000)

class ExecuteInput(QueryInput):
    selected_location: dict|None = None

class ConversationMessageInput(QueryInput):
    conversation_id: str|None = None
    selected_location: dict|None = None
