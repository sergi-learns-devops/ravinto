from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings

# Secrets that must never be used outside of a throwaway local environment.
_INSECURE_SECRETS = {
    "change-this-to-a-secure-random-string",
    "change-this-to-a-secure-random-string-of-64-characters-minimum",
    "dev-secret-key-change-in-production-please",
    "ravinto-homelab-secret-change-me-in-production",
    "secret",
    "changeme",
}


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/ravinto.db"

    # JWT (no default on purpose: the app must fail fast if it is not configured)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "ravinto"
    JWT_AUDIENCE: str = "ravinto-web"

    # Refresh token cookie
    REFRESH_COOKIE_NAME: str = "ravinto_refresh"
    SESSION_MARKER_COOKIE_NAME: str = "ravinto_session"
    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_COOKIE_SAMESITE: str = "lax"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # Docs (disabled by default in production)
    ENABLE_DOCS: bool = False

    # Open Food Facts
    OFF_API_URL: str = "https://world.openfoodfacts.org/api/v2"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @field_validator("SECRET_KEY")
    @classmethod
    def _validate_secret_key(cls, value: str) -> str:
        if value in _INSECURE_SECRETS or len(value.encode("utf-8")) < 32:
            raise ValueError(
                "SECRET_KEY insegura. Genera una con: "
                "python3 -c \"import secrets; print(secrets.token_urlsafe(64))\""
            )
        return value

    @field_validator("CORS_ORIGINS")
    @classmethod
    def _validate_cors_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if not origins:
            raise ValueError("CORS_ORIGINS no puede estar vacío")
        if "*" in origins:
            raise ValueError(
                "CORS_ORIGINS no puede contener '*': usa una lista explícita de orígenes"
            )
        return ",".join(origins)

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
