from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.analytics import service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/weekly")
async def get_weekly(
    start_date: date = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get weekly calorie summary (last 7 days by default)."""
    return await service.get_weekly_summary(db, current_user.id, start_date)


@router.get("/monthly")
async def get_monthly(
    year: int = Query(ge=2020, le=2100),
    month: int = Query(ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get monthly calorie summary."""
    return await service.get_monthly_summary(db, current_user.id, year, month)


@router.get("/streak")
async def get_streak(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current logging streak."""
    streak = await service.get_streak(db, current_user.id)
    return {"streak_days": streak}


@router.get("/macros")
async def get_macros(
    target_date: date = Query(default=None, alias="date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get macronutrient breakdown for a specific day."""
    if target_date is None:
        target_date = date.today()
    return await service.get_macros_breakdown(db, current_user.id, target_date)
