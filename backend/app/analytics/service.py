from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.meals.models import Meal, MealItem
from app.foods.models import FoodItem


async def get_weekly_summary(db: AsyncSession, user_id: str, start_date: Optional[date] = None):
    """Get calorie summary for the last 7 days."""
    if start_date is None:
        start_date = date.today() - timedelta(days=6)
    end_date = start_date + timedelta(days=6)

    result = await db.execute(
        select(
            Meal.date,
            func.sum(MealItem.kcal_total).label("total_kcal"),
            func.count(MealItem.id).label("items_count"),
        )
        .join(MealItem, MealItem.meal_id == Meal.id)
        .where(
            Meal.user_id == user_id,
            Meal.date >= start_date,
            Meal.date <= end_date,
        )
        .group_by(Meal.date)
        .order_by(Meal.date)
    )

    rows = result.all()
    daily_data = {row.date: {"kcal": round(row.total_kcal, 1), "items": row.items_count} for row in rows}

    # Fill missing days with 0
    days = []
    current = start_date
    while current <= end_date:
        data = daily_data.get(current, {"kcal": 0, "items": 0})
        days.append({
            "date": current.isoformat(),
            "total_kcal": data["kcal"],
            "items_count": data["items"],
        })
        current += timedelta(days=1)

    total_kcal = sum(d["total_kcal"] for d in days)
    avg_kcal = round(total_kcal / 7, 1) if days else 0

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "days": days,
        "total_kcal": round(total_kcal, 1),
        "average_kcal": avg_kcal,
    }


async def get_monthly_summary(db: AsyncSession, user_id: str, year: int, month: int):
    """Get calorie summary for a specific month."""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)

    result = await db.execute(
        select(
            Meal.date,
            func.sum(MealItem.kcal_total).label("total_kcal"),
        )
        .join(MealItem, MealItem.meal_id == Meal.id)
        .where(
            Meal.user_id == user_id,
            Meal.date >= start_date,
            Meal.date <= end_date,
        )
        .group_by(Meal.date)
        .order_by(Meal.date)
    )

    rows = result.all()
    daily_data = {row.date: round(row.total_kcal, 1) for row in rows}

    # Fill all days of month
    days = []
    current = start_date
    while current <= end_date:
        days.append({
            "date": current.isoformat(),
            "total_kcal": daily_data.get(current, 0),
        })
        current += timedelta(days=1)

    total_kcal = sum(d["total_kcal"] for d in days)
    days_with_data = len([d for d in days if d["total_kcal"] > 0])
    avg_kcal = round(total_kcal / days_with_data, 1) if days_with_data else 0

    return {
        "year": year,
        "month": month,
        "days": days,
        "total_kcal": round(total_kcal, 1),
        "average_kcal": avg_kcal,
        "days_tracked": days_with_data,
        "days_in_month": len(days),
    }


async def get_streak(db: AsyncSession, user_id: str) -> int:
    """Calculate the current streak (consecutive days with logged meals).

    Uses a single query for all distinct logged dates instead of one query per
    day (avoids N+1 when the user has a long history).
    """
    result = await db.execute(
        select(Meal.date)
        .where(Meal.user_id == user_id)
        .distinct()
        .order_by(Meal.date.desc())
    )
    logged_dates = set(result.scalars().all())

    streak = 0
    current_date = date.today()
    while current_date in logged_dates:
        streak += 1
        current_date -= timedelta(days=1)

    return streak


async def get_macros_breakdown(db: AsyncSession, user_id: str, target_date: date):
    """Get macronutrient breakdown for a specific day."""
    result = await db.execute(
        select(
            func.sum(MealItem.kcal_total).label("total_kcal"),
            func.sum(FoodItem.protein_per_100g * MealItem.quantity_grams / 100).label("protein"),
            func.sum(FoodItem.carbs_per_100g * MealItem.quantity_grams / 100).label("carbs"),
            func.sum(FoodItem.fat_per_100g * MealItem.quantity_grams / 100).label("fat"),
            func.sum(FoodItem.fiber_per_100g * MealItem.quantity_grams / 100).label("fiber"),
        )
        .join(Meal, MealItem.meal_id == Meal.id)
        .join(FoodItem, MealItem.food_item_id == FoodItem.id)
        .where(Meal.user_id == user_id, Meal.date == target_date)
    )

    row = result.one()
    return {
        "date": target_date.isoformat(),
        "total_kcal": round(row.total_kcal or 0, 1),
        "protein_g": round(row.protein or 0, 1),
        "carbs_g": round(row.carbs or 0, 1),
        "fat_g": round(row.fat or 0, 1),
        "fiber_g": round(row.fiber or 0, 1),
    }
