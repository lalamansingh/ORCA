import re
from app.llm.base import LLMProvider
from app.llm.models import ORCAFactContext,ResponseDraft
from app.services.grounded_response_validator import GroundedResponseValidator
from app.llm.prompts import ORCA_SYSTEM_PROMPT,RESPONSE_PROMPT

NUMERIC=re.compile(r"(?<![\w.])-?\d+(?:\.\d+)?")


class AIResponseService:
    def __init__(self,provider:LLMProvider)->None:self.provider=provider
    async def format(self,context:ORCAFactContext,language:str="en")->ResponseDraft:
        prompt=f"{RESPONSE_PROMPT}\nRESPONSE_LANGUAGE:{language}\nFACT_CONTEXT:{context.model_dump_json()}"
        draft,_=await self.provider.generate_structured(ORCA_SYSTEM_PROMPT,prompt,ResponseDraft)
        allowed_refs={item.evidence_id for item in context.evidence}
        draft.evidence_refs=[ref for ref in draft.evidence_refs if ref in allowed_refs]
        allowed_numbers={number for item in context.evidence for number in NUMERIC.findall(item.formatted_value)}
        if any(number not in allowed_numbers for number in NUMERIC.findall(draft.answer)):
            raise ValueError("LLM_UNSUPPORTED_NUMERIC_CLAIM")
        return GroundedResponseValidator().validate(draft,context)
