from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.meals import service
from app.meals.schemas import (
    MealCreate,
    MealItemAdd,
    MealResponse,
    DailySummary,
)

router = APIRouter(prefix="/api/meals", tags=["meals"])


@router.post("/", response_model=MealResponse, status_code=201)
async def create_meal(
    data: MealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new meal with food items."""
    return await service.create_meal(db, data, current_user.id)


@router.get("/daily", response_model=DailySummary)
async def get_daily_summary(
    target_date: date = Query(default=None, alias="date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get daily summary with all meals and totals."""
    if target_date is None:
        target_date = date.today()

    meals = await service.get_meals_by_date(db, current_user.id, target_date)

    total_kcal = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0

    for meal in meals:
        total_kcal += meal.total_kcal
        for item in meal.items:
            total_protein += item.protein_total
            total_carbs += item.carbs_total
            total_fat += item.fat_total

    return DailySummary(
        date=target_date,
        total_kcal=round(total_kcal, 1),
        total_protein=round(total_protein, 1),
        total_carbs=round(total_carbs, 1),
        total_fat=round(total_fat, 1),
        goal_kcal=current_user.daily_goal_kcal,
        meals=meals,
        meals_count=len(meals),
    )


@router.get("/{meal_id}", response_model=MealResponse)
async def get_meal(
    meal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific meal by ID."""
    return await service.get_meal_by_id(db, meal_id, current_user.id)


@router.post("/{meal_id}/items", response_model=MealResponse)
async def add_meal_item(
    meal_id: str,
    data: MealItemAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add an item to an existing meal."""
    return await service.add_item_to_meal(db, meal_id, data, current_user.id)


@router.delete("/{meal_id}", status_code=204)
async def delete_meal(
    meal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a meal and all its items."""
    await service.delete_meal(db, meal_id, current_user.id)


@router.delete("/items/{item_id}", status_code=204)
async def delete_meal_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific item from a meal."""
    await service.delete_meal_item(db, item_id, current_user.id)
