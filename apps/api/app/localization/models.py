from enum import StrEnum
from pydantic import BaseModel

class LanguageCode(StrEnum):
    EN="en"; HI="hi"; HI_LATN="hi-Latn"; TA="ta"; TE="te"; ML="ml"; KN="kn"; BN="bn"; OR="or"; GU="gu"; MR="mr"; UNKNOWN="unknown"
class LanguageCapability(BaseModel):
    language_code: LanguageCode
    display_name: str
    native_name: str
    status: str
    input_supported: bool
    output_supported: bool
    tested: bool

CAPABILITIES=[
    LanguageCapability(language_code=LanguageCode.EN,display_name="English",native_name="English",status="SUPPORTED",input_supported=True,output_supported=True,tested=True),
    LanguageCapability(language_code=LanguageCode.HI,display_name="Hindi",native_name="हिन्दी",status="SUPPORTED",input_supported=True,output_supported=True,tested=True),
    LanguageCapability(language_code=LanguageCode.HI_LATN,display_name="Hinglish",native_name="Hinglish",status="SUPPORTED",input_supported=True,output_supported=True,tested=True),
    LanguageCapability(language_code=LanguageCode.TA,display_name="Tamil",native_name="தமிழ்",status="BETA",input_supported=True,output_supported=True,tested=True),
]
