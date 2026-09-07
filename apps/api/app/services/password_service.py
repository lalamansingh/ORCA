"""Argon2 password hashing isolated from transport code."""
from pwdlib import PasswordHash
_password_hash = PasswordHash.recommended()
def hash_password(password: str) -> str: return _password_hash.hash(password)
def verify_password(password: str, password_hash: str | None) -> bool: return password_hash is not None and _password_hash.verify(password, password_hash)
