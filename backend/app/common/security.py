from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import uuid
import jwt
from jwt import PyJWTError

from app.config import get_settings

settings = get_settings()


def utcnow() -> datetime:
    """Naive UTC timestamp, used for database columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except (ValueError, TypeError):
        # Corrupted/malformed hash must behave like invalid credentials, not a 500.
        return False


def _build_payload(data: dict, token_type: str, expires_delta, jti: str) -> dict:
    now = datetime.now(timezone.utc)
    to_encode = data.copy()
    to_encode.update(
        {
            "exp": now + expires_delta,
            "iat": now,
            "nbf": now,
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "type": token_type,
            "jti": jti,
        }
    )
    return to_encode


def create_access_token(data: dict) -> str:
    payload = _build_payload(
        data,
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        str(uuid.uuid4()),
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict, jti: str) -> str:
    payload = _build_payload(
        data,
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        jti,
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def refresh_token_expiry() -> datetime:
    return utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


def decode_token(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
        )
    except PyJWTError:
        return None

    # Defensive claim checks, independent of library defaults.
    if payload.get("iss") != settings.JWT_ISSUER:
        return None
    audience = payload.get("aud")
    audiences = audience if isinstance(audience, list) else [audience]
    if settings.JWT_AUDIENCE not in audiences:
        return None
    if not payload.get("sub") or not payload.get("jti") or not payload.get("exp"):
        return None
    if expected_type is not None and payload.get("type") != expected_type:
        return None
    return payload
