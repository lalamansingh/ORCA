from uuid import uuid4
import pytest
from pydantic import ValidationError
from app.core.config import Settings
from app.schemas.auth import UserProfileUpdate, UserRegister
from app.services.password_service import hash_password, verify_password
from app.services.token_service import TokenError, create_access_token, create_refresh_token, decode_token

def settings() -> Settings: return Settings(jwt_secret_key="test-secret-that-is-not-a-production-secret")
def test_password_is_argon2_hash_and_verifies() -> None:
    password_hash=hash_password("a secure test password")
    assert password_hash != "a secure test password" and verify_password("a secure test password",password_hash) and not verify_password("wrong password",password_hash)
def test_access_and_refresh_tokens_are_distinct() -> None:
    user_id=uuid4(); access=create_access_token(user_id,settings()); refresh,jti=create_refresh_token(user_id,settings())
    assert decode_token(access,"access",settings())["sub"]==str(user_id)
    assert decode_token(refresh,"refresh",settings())["jti"]==jti
    with pytest.raises(TokenError): decode_token(access,"refresh",settings())
def test_invalid_token_is_rejected() -> None:
    with pytest.raises(TokenError): decode_token("invalid.jwt.value","access",settings())
def test_registration_rejects_short_password() -> None:
    with pytest.raises(ValidationError): UserRegister(email="user@example.com",full_name="User",password="too-short")
def test_profile_requires_complete_coordinate_pair() -> None:
    with pytest.raises(ValidationError): UserProfileUpdate(default_latitude=13.08)
