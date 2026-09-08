import re
from app.localization.models import LanguageCode

DEVANAGARI = re.compile(r"[\u0900-\u097F]")
TAMIL = re.compile(r"[\u0B80-\u0BFF]")
TELUGU = re.compile(r"[\u0C00-\u0C7F]")
MALAYALAM = re.compile(r"[\u0D00-\u0D7F]")
GUJARATI = re.compile(r"[\u0A80-\u0AFF]")
BENGALI = re.compile(r"[\u0980-\u09FF]")
ODIA = re.compile(r"[\u0B00-\u0B7F]")
KANNADA = re.compile(r"[\u0C80-\u0CFF]")

MARATHI_MARKERS = {"आहे", "नाही", "कसा", "कशी", "वारा", "लाटा", "मासे", "समुद्र"}
HINGLISH = {"kal", "aaj", "subah", "shaam", "samundar", "samandar", "jana", "jaana", "safe", "dikhao", "dikha", "wahan", "mausam", "mosam", "lehar", "lahar", "machhli", "machli", "kya", "kia", "kyu", "kyon", "kaisa", "batao"}
TANGLISH = {"kadal", "meen", "kaathu", "alai", "alaii", "epdi", "irukku", "pogalama", "meenpidi"}
TELUGLISH = {"samudram", "chepalu", "alalu", "ela", "undi", "vellavacha", "gaali"}
MANGLISH = {"kadal", "thiramaala", "kaattu", "engane", "undu", "pokamo", "meen"}
GUJLISH = {"daryo", "dariya", "havaman", "moja", "pavan", "kevu", "chhe", "jaay"}

def detect_language(text: str) -> tuple[str, str, bool, float, list[str]]:
    lower = text.lower()
    words = set(re.findall(r"[a-zA-Z\u0900-\u0D7F]+", lower))

    if TAMIL.search(text): return LanguageCode.TA.value, "Tamil", False, 0.99, []
    if TELUGU.search(text): return LanguageCode.TE.value, "Telugu", False, 0.99, []
    if MALAYALAM.search(text): return LanguageCode.ML.value, "Malayalam", False, 0.99, []
    if GUJARATI.search(text): return LanguageCode.GU.value, "Gujarati", False, 0.99, []
    if BENGALI.search(text): return LanguageCode.BN.value, "Bengali", False, 0.99, []
    if ODIA.search(text): return LanguageCode.OR.value, "Odia", False, 0.99, []
    if KANNADA.search(text): return LanguageCode.KN.value, "Kannada", False, 0.99, []

    if DEVANAGARI.search(text):
        if any(marker in text for marker in MARATHI_MARKERS):
            return LanguageCode.MR.value, "Marathi", False, 0.95, []
        return LanguageCode.HI.value, "Hindi", False, 0.99, []

    if len(words & HINGLISH) >= 1:
        return LanguageCode.HI_LATN.value, "Hinglish", True, 0.95, ["en"]
    if len(words & TANGLISH) >= 1:
        return LanguageCode.TA.value, "Tamil (Romanized)", True, 0.90, ["en"]
    if len(words & TELUGLISH) >= 1:
        return LanguageCode.TE.value, "Telugu (Romanized)", True, 0.90, ["en"]
    if len(words & MANGLISH) >= 1:
        return LanguageCode.ML.value, "Malayalam (Romanized)", True, 0.90, ["en"]
    if len(words & GUJLISH) >= 1:
        return LanguageCode.GU.value, "Gujarati (Romanized)", True, 0.90, ["en"]

    return LanguageCode.EN.value, "English", False, 0.80, []

