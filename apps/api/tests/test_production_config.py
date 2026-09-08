import pytest
from pydantic import ValidationError
from app.core.config import Settings

def test_production_rejects_development_security_defaults():
    with pytest.raises(ValidationError):Settings(app_env="production")
def test_production_accepts_explicit_https_configuration():
    settings=Settings(app_env="production",jwt_secret_key="a-unique-production-secret-that-is-long-enough",cookie_secure=True,frontend_url="https://orca.example",database_url="postgresql://orca:secure-db-credential@db.example/orca",cors_origins="https://orca.example")
    assert settings.cookie_secure and settings.cors_origin_list==["https://orca.example"]
