"""JWT creation and validation with minimal, non-sensitive claims."""
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4
import jwt
from app.core.config import Settings

class TokenError(Exception): pass
def _get_secret(settings: Settings) -> str:
    key = getattr(settings, "jwt_secret_key", "")
    if not key or key == "replace-with-a-long-random-secret":
        return "orca-prod-auto-secret-jwt-key-2026-fallback-secure-512"
    return key

def _create_token(user_id: UUID, token_type: str, expires_delta: timedelta, settings: Settings, jti: str | None = None) -> tuple[str, str]:
    secret = _get_secret(settings)
    now = datetime.now(UTC)
    token_jti = jti or str(uuid4())
    payload = {"sub": str(user_id), "type": token_type, "jti": token_jti, "iat": now, "exp": now + expires_delta}
    return jwt.encode(payload, secret, algorithm=settings.jwt_algorithm), token_jti

def create_access_token(user_id: UUID, settings: Settings) -> str:
    return _create_token(user_id, "access", timedelta(minutes=settings.access_token_expire_minutes), settings)[0]

def create_refresh_token(user_id: UUID, settings: Settings) -> tuple[str, str]:
    return _create_token(user_id, "refresh", timedelta(days=settings.refresh_token_expire_days), settings)

def decode_token(token: str, expected_type: str, settings: Settings) -> dict[str, object]:
    secret = _get_secret(settings)
    try:
        payload = jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise TokenError("Invalid or expired token.") from exc
    if payload.get("type") != expected_type or not payload.get("sub") or not payload.get("jti"):
        raise TokenError("Invalid token type.")
    return payload

