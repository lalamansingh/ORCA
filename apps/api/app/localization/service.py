import re
from app.localization.language_detection import detect_language
from app.localization.models import CAPABILITIES,LanguageCode,LanguageCapability
from app.localization.terminology import TERMINOLOGY

class LocalizationService:
    """Language detection and safe deterministic localization; never executes tools."""
    def detect(self,text:str):
        code,name,romanized,confidence,secondary=detect_language(text)
        script="Devanagari" if code=="hi" else "Tamil" if code=="ta" else "Latin"
        mode="ROMANIZED" if romanized else "MIXED" if secondary else "MONOLINGUAL"
        return {"language_code":code,"language_name":name,"script":script,"language_mode":mode,"confidence":confidence,"dominant_language":code,"secondary_languages":secondary,"romanized":romanized}
    def choose_response_language(self,explicit:str|None,detected:str|None,active:str|None,preferred:str|None)->str:
        for value in (explicit,detected,active,preferred,"en"):
            if value in TERMINOLOGY:return value
        return "en"
    def label(self,key:str,language:str="en")->str:return TERMINOLOGY.get(language,TERMINOLOGY["en"]).get(key,TERMINOLOGY["en"].get(key,key))
    def validate_protected_facts(self,source:str,localized:str,facts:list[str])->bool:
        return all(token in localized for token in facts)
    @staticmethod
    def capabilities()->list[LanguageCapability]:return CAPABILITIES
