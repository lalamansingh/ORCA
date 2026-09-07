from pydantic import BaseModel,Field


class QueryInput(BaseModel):
    query:str=Field(min_length=1,max_length=8000)
