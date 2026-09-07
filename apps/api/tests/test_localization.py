from app.localization.service import LocalizationService

def test_detects_target_languages_and_hinglish():
    service=LocalizationService()
    assert service.detect("कल सुबह समुद्र में जाना सुरक्षित है?")["language_code"]=="hi"
    assert service.detect("Nearest PFZ dikhao")["language_code"]=="hi-Latn"
    assert service.detect("நாளை கடலுக்கு போவது பாதுகாப்பானதா?")["language_code"]=="ta"

def test_language_precedence_and_protected_facts():
    service=LocalizationService()
    assert service.choose_response_language("en","hi","ta","hi")=="en"
    assert service.validate_protected_facts("2.8 m · INCOIS","உயரம் 2.8 m · INCOIS",["2.8 m","INCOIS"])
    assert not service.validate_protected_facts("2.8 m","உயரம் 3 m",["2.8 m"])
