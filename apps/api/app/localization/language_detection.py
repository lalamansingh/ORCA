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

MARATHI_MARKERS = {"आहे", "नाही", "कसा", "कशी", "वारा", "लाटा", "मासे", "समुद्र", "मासेमारी", "किनाऱ्यावर", "इशारे", "सुरक्षित", "सांगा", "दाखवा", "काय"}

HINGLISH = {
    "kal", "aaj", "subah", "shaam", "sham", "raat", "samundar", "samandar", "jana", "jaana", "jaa", "ja",
    "sakta", "sakte", "sakti", "safe", "khatra", "dikhao", "dikha", "batao", "bata", "bataiye", "btao", "karo",
    "wahan", "yahan", "mausam", "mosam", "hawa", "lehar", "lahar", "lehrein", "lahrein", "machhli", "machli",
    "pani", "paani", "nhi", "nahi", "tha", "raha", "rahi", "chal", "karein", "rakhein", "kya", "kia", "kyaa",
    "kyu", "kyun", "kyon", "kaisa", "kaisi", "kaise", "kesa", "kese", "hai", "hain", "he", "ho", "hoga", "hogi",
    "batao", "btao", "karna", "kare", "mein", "me"
}

TANGLISH = {
    "kadal", "kadalukku", "meen", "meengal", "kaathu", "kaatu", "alai", "alaii", "alaigal", "epdi", "eppadi",
    "irukku", "iruka", "irukkuma", "pogalama", "pogalaama", "meenpidi", "padagu", "valai", "engu", "enna", "paadhukaappu"
}

TELUGLISH = {
    "samudram", "samudramlo", "chepalu", "alalu", "ala", "ela", "undi", "undha", "undhi", "vellavacha",
    "vellacha", "gaali", "gali", "padava", "vetaku", "ikkada", "enti", "surakshitam"
}

MANGLISH = {
    "kadal", "kadallil", "thiramaala", "thira", "kaattu", "kattu", "engane", "undu", "undo", "pokamo",
    "pokaan", "meen", "vallam", "enthaanu", "surakshitham"
}

GUJLISH = {
    "daryo", "dariya", "dariyama", "havaman", "moja", "mojan", "pavan", "kevu", "che", "chhe", "jaay",
    "javay", "surakshit", "machhi", "machhli"
}

MARATHILSH = {
    "samudra", "samudrat", "kinara", "lata", "latanchi", "vara", "varyacha", "kasa", "kashi", "kiti",
    "aahe", "ahe", "nahi", "jaave", "jaau", "shakto", "mase", "masemari", "sang"
}

BONGLISH = {
    "shomudro", "somudro", "somudre", "dheu", "dheuer", "batash", "batas", "kemon", "ache", "achhe",
    "jawa", "jaoa", "jabe", "maach", "mach", "bhalo"
}

KANGLISH = {
    "samudra", "samudrakke", "kadalu", "ale", "alegalu", "gaali", "gali", "meenu", "hegide", "hogabahuda",
    "surakshita", "doni"
}

ODIALSH = {
    "samudra", "samudrara", "dheu", "pabana", "machha", "kemiti", "jaipariba", "achhi"
}

def detect_language(text: str) -> tuple[str, str, bool, float, list[str]]:
    lower = text.lower()
    words = set(re.findall(r"[a-zA-Z\u0900-\u0D7F]+", lower))

    # Native Indic Scripts (Direct 100% Match)
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

    # Romanized / Transliterated Dialects
    if len(words & TANGLISH) >= 1:
        return LanguageCode.TA.value, "Tamil (Romanized)", True, 0.95, ["en"]
    if len(words & TELUGLISH) >= 1:
        return LanguageCode.TE.value, "Telugu (Romanized)", True, 0.95, ["en"]
    if len(words & MANGLISH) >= 1:
        return LanguageCode.ML.value, "Malayalam (Romanized)", True, 0.95, ["en"]
    if len(words & GUJLISH) >= 1:
        return LanguageCode.GU.value, "Gujarati (Romanized)", True, 0.95, ["en"]
    if len(words & MARATHILSH) >= 1:
        return LanguageCode.MR.value, "Marathi (Romanized)", True, 0.95, ["en"]
    if len(words & BONGLISH) >= 1:
        return LanguageCode.BN.value, "Bengali (Romanized)", True, 0.95, ["en"]
    if len(words & KANGLISH) >= 1:
        return LanguageCode.KN.value, "Kannada (Romanized)", True, 0.95, ["en"]
    if len(words & ODIALSH) >= 1:
        return LanguageCode.OR.value, "Odia (Romanized)", True, 0.95, ["en"]
    if len(words & HINGLISH) >= 1:
        return LanguageCode.HI_LATN.value, "Hinglish", True, 0.95, ["en"]

    return LanguageCode.EN.value, "English", False, 0.80, []


