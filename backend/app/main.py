from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.auth.router import router as auth_router
from app.foods.router import router as foods_router
from app.meals.router import router as meals_router
from app.analytics.router import router as analytics_router

# Import all models so they are registered with Base
from app.auth.models import User  # noqa: F401
from app.foods.models import FoodItem, UserFavorite  # noqa: F401
from app.meals.models import Meal, MealItem  # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create data directory for SQLite
    Path("./data").mkdir(exist_ok=True)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    # Cleanup
    await engine.dispose()


app = FastAPI(
    title="Ravinto API",
    description="API para seguimiento nutricional consciente",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(foods_router)
app.include_router(meals_router)
app.include_router(analytics_router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "Ravinto", "version": "1.0.0"}
