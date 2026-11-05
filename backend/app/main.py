from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from app.config import get_settings
from app.database import engine
from app.auth.router import router as auth_router
from app.foods.router import router as foods_router
from app.meals.router import router as meals_router
from app.analytics.router import router as analytics_router
from app.workouts.router import router as workouts_router

# Import all models so they are registered with Base
from app.auth.models import User  # noqa: F401
from app.foods.models import FoodItem, UserFavorite  # noqa: F401
from app.meals.models import Meal, MealItem  # noqa: F401
from app.workouts.models import Workout  # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create data directory for SQLite
    Path("./data").mkdir(exist_ok=True)

    # Migrations are applied exactly once by entrypoint.sh before workers start.
    # Here we only verify the schema so a misconfigured deployment fails fast
    # instead of silently serving 500s.
    async with engine.connect() as conn:
        tables = await conn.run_sync(
            lambda sync_conn: set(inspect(sync_conn).get_table_names())
        )
    if "alembic_version" not in tables or "refresh_tokens" not in tables:
        raise RuntimeError(
            "Esquema de base de datos desactualizado. "
            "Ejecuta 'alembic upgrade head' antes de arrancar la API."
        )

    yield

    # Cleanup
    await engine.dispose()


app = FastAPI(
    title="Ravinto API",
    description="API para seguimiento nutricional consciente",
    version="1.0.0",
    lifespan=lifespan,
    # API docs are disabled unless explicitly enabled (ENABLE_DOCS=true).
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
)

# CORS: explicit origins only (validated in Settings), credentials enabled
# because the refresh token travels in an HttpOnly cookie.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response

# Routers
app.include_router(auth_router)
app.include_router(foods_router)
app.include_router(meals_router)
app.include_router(analytics_router)
app.include_router(workouts_router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "Ravinto", "version": "1.0.0"}
