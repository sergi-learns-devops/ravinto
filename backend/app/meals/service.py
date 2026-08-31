from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.meals.models import Meal, MealItem
from app.meals.schemas import MealCreate, MealItemAdd, MealItemResponse, MealResponse
from app.foods.models import FoodItem
from app.foods.service import get_food_by_id
from app.common.exceptions import NotFoundException, ForbiddenException


def _build_meal_item_response(item: MealItem, food: FoodItem) -> MealItemResponse:
    """Build a MealItemResponse from MealItem + FoodItem."""
    ratio = item.quantity_grams / 100
    return MealItemResponse(
        id=item.id,
        food_item_id=item.food_item_id,
        food_name=food.name,
        food_brand=food.brand,
        quantity_grams=item.quantity_grams,
        kcal_total=item.kcal_total,
        protein_total=round(food.protein_per_100g * ratio, 1),
        carbs_total=round(food.carbs_per_100g * ratio, 1),
        fat_total=round(food.fat_per_100g * ratio, 1),
    )


def _build_meal_response(meal: Meal) -> MealResponse:
    """Build a MealResponse from Meal with items."""
    items = []
    total_kcal = 0
    for item in meal.items:
        item_resp = _build_meal_item_response(item, item.food_item)
        items.append(item_resp)
        total_kcal += item.kcal_total

    return MealResponse(
        id=meal.id,
        meal_type=meal.meal_type,
        date=meal.date,
        notes=meal.notes,
        items=items,
        total_kcal=round(total_kcal, 1),
        created_at=meal.created_at,
    )


async def create_meal(db: AsyncSession, data: MealCreate, user_id: str) -> MealResponse:
    """Create a new meal with items."""
    meal_date = data.date or date.today()

    meal = Meal(
        user_id=user_id,
        meal_type=data.meal_type.value,
        date=meal_date,
        notes=data.notes,
    )
    db.add(meal)
    await db.flush()

    # Create meal items
    for item_data in data.items:
        food = await get_food_by_id(db, item_data.food_item_id)
        kcal_total = round((food.kcal_per_100g * item_data.quantity_grams) / 100, 1)

        meal_item = MealItem(
            meal_id=meal.id,
            food_item_id=item_data.food_item_id,
            quantity_grams=item_data.quantity_grams,
            kcal_total=kcal_total,
        )
        db.add(meal_item)

    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Meal)
        .where(Meal.id == meal.id)
        .options(selectinload(Meal.items).selectinload(MealItem.food_item))
    )
    meal = result.scalar_one()
    return _build_meal_response(meal)


async def get_meals_by_date(db: AsyncSession, user_id: str, target_date: date) -> list[MealResponse]:
    """Get all meals for a user on a specific date."""
    result = await db.execute(
        select(Meal)
        .where(Meal.user_id == user_id, Meal.date == target_date)
        .options(selectinload(Meal.items).selectinload(MealItem.food_item))
        .order_by(Meal.created_at)
    )
    meals = result.scalars().all()
    return [_build_meal_response(m) for m in meals]


async def get_meal_by_id(db: AsyncSession, meal_id: str, user_id: str) -> MealResponse:
    """Get a specific meal, verifying ownership."""
    result = await db.execute(
        select(Meal)
        .where(Meal.id == meal_id)
        .options(selectinload(Meal.items).selectinload(MealItem.food_item))
    )
    meal = result.scalar_one_or_none()
    if not meal:
        raise NotFoundException("Comida")
    if meal.user_id != user_id:
        raise ForbiddenException()
    return _build_meal_response(meal)


async def add_item_to_meal(
    db: AsyncSession, meal_id: str, data: MealItemAdd, user_id: str
) -> MealResponse:
    """Add an item to an existing meal."""
    result = await db.execute(select(Meal).where(Meal.id == meal_id))
    meal = result.scalar_one_or_none()
    if not meal:
        raise NotFoundException("Comida")
    if meal.user_id != user_id:
        raise ForbiddenException()

    food = await get_food_by_id(db, data.food_item_id)
    kcal_total = round((food.kcal_per_100g * data.quantity_grams) / 100, 1)

    meal_item = MealItem(
        meal_id=meal_id,
        food_item_id=data.food_item_id,
        quantity_grams=data.quantity_grams,
        kcal_total=kcal_total,
    )
    db.add(meal_item)
    await db.flush()

    # Reload
    result = await db.execute(
        select(Meal)
        .where(Meal.id == meal_id)
        .options(selectinload(Meal.items).selectinload(MealItem.food_item))
    )
    meal = result.scalar_one()
    return _build_meal_response(meal)


async def delete_meal(db: AsyncSession, meal_id: str, user_id: str) -> None:
    """Delete a meal (cascades to items)."""
    result = await db.execute(select(Meal).where(Meal.id == meal_id))
    meal = result.scalar_one_or_none()
    if not meal:
        raise NotFoundException("Comida")
    if meal.user_id != user_id:
        raise ForbiddenException()
    await db.delete(meal)


async def delete_meal_item(db: AsyncSession, item_id: str, user_id: str) -> None:
    """Delete a specific item from a meal."""
    result = await db.execute(
        select(MealItem)
        .where(MealItem.id == item_id)
        .options(selectinload(MealItem.meal))
    )
    meal_item = result.scalar_one_or_none()
    if not meal_item:
        raise NotFoundException("Elemento de comida")
    if meal_item.meal.user_id != user_id:
        raise ForbiddenException()
    await db.delete(meal_item)
