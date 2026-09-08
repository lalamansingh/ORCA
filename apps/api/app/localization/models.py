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

CAPABILITIES = [
    LanguageCapability(language_code=LanguageCode.EN, display_name="English", native_name="English", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.HI, display_name="Hindi", native_name="हिन्दी", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.HI_LATN, display_name="Hinglish", native_name="Hinglish", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.TA, display_name="Tamil", native_name="தமிழ்", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.TE, display_name="Telugu", native_name="తెలుగు", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.ML, display_name="Malayalam", native_name="മലയാളം", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.GU, display_name="Gujarati", native_name="ગુજરાતી", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.MR, display_name="Marathi", native_name="मराठी", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.BN, display_name="Bengali", native_name="বাংলা", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.OR, display_name="Odia", native_name="ଓଡ଼ିଆ", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
    LanguageCapability(language_code=LanguageCode.KN, display_name="Kannada", native_name="ಕನ್ನಡ", status="SUPPORTED", input_supported=True, output_supported=True, tested=True),
]
