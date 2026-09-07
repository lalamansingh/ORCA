import re
from app.localization.models import LanguageCode

DEVANAGARI=re.compile(r"[\u0900-\u097F]"); TAMIL=re.compile(r"[\u0B80-\u0BFF]")
HINGLISH={"kal","aaj","subah","samundar","samandar","jana","jaana","safe","dikhao","dikha","wahan","mausam","mosam","lehar","lahar","machhli","kya","kia","kyu","kyon"}
def detect_language(text:str)->tuple[str,str,bool,float,list[str]]:
    words=set(re.findall(r"[a-zA-Z]+",text.lower())); devan=bool(DEVANAGARI.search(text)); tamil=bool(TAMIL.search(text))
    if tamil:return LanguageCode.TA.value,"Tamil",False,.98,[]
    if devan:return LanguageCode.HI.value,"Hindi",False,.98,[]
    hits=len(words & HINGLISH)
    if hits>=1:return LanguageCode.HI_LATN.value,"Hinglish",True,min(.95,.55+hits*.06),["en"] if any(w in words for w in {"tomorrow","waves","show","risk"}) else []
    return LanguageCode.EN.value,"English",False,.7,[]
