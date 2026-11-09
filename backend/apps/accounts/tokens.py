import hashlib
import secrets


def generate_token() -> str:
    """256 random bits, URL-safe: impossible to guess."""
    return secrets.token_urlsafe(32)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()
