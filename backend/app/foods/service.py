from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.foods.models import FoodItem, UserFavorite
from app.foods.schemas import FoodItemCreate
from app.common.exceptions import NotFoundException

settings = get_settings()


async def search_foods_local(db: AsyncSession, query: str, limit: int = 20) -> list[FoodItem]:
    """Search foods in local database."""
    result = await db.execute(
        select(FoodItem)
        .where(FoodItem.name.ilike(f"%{query}%"))
        .order_by(FoodItem.name)
        .limit(limit)
    )
    return list(result.scalars().all())


async def search_foods_openfoodfacts(query: str, limit: int = 10) -> list[dict]:
    """Search foods in Open Food Facts API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.OFF_API_URL}/search",
                params={
                    "search_terms": query,
                    "fields": "code,product_name,brands,nutriments,image_url",
                    "page_size": limit,
                    "json": 1,
                },
            )
            if response.status_code != 200:
                return []

            data = response.json()
            products = data.get("products", [])

            results = []
            for p in products:
                nutriments = p.get("nutriments", {})
                name = p.get("product_name", "").strip()
                if not name:
                    continue

                results.append({
                    "barcode": p.get("code"),
                    "name": name,
                    "brand": p.get("brands", "").split(",")[0].strip() or None,
                    "kcal_per_100g": nutriments.get("energy-kcal_100g", 0) or 0,
                    "protein_per_100g": nutriments.get("proteins_100g", 0) or 0,
                    "carbs_per_100g": nutriments.get("carbohydrates_100g", 0) or 0,
                    "fat_per_100g": nutriments.get("fat_100g", 0) or 0,
                    "fiber_per_100g": nutriments.get("fiber_100g", 0) or 0,
                    "image_url": p.get("image_url"),
                    "source": "open_food_facts",
                })

            return results
    except (httpx.RequestError, Exception):
        return []


async def get_food_by_barcode_local(db: AsyncSession, barcode: str) -> Optional[FoodItem]:
    """Get food by barcode from local database."""
    result = await db.execute(select(FoodItem).where(FoodItem.barcode == barcode))
    return result.scalar_one_or_none()


async def get_food_by_barcode_openfoodfacts(barcode: str) -> Optional[dict]:
    """Get food by barcode from Open Food Facts."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.OFF_API_URL}/product/{barcode}",
                params={"fields": "code,product_name,brands,nutriments,image_url"},
            )
            if response.status_code != 200:
                return None

            data = response.json()
            if data.get("status") != 1:
                return None

            p = data.get("product", {})
            nutriments = p.get("nutriments", {})
            name = p.get("product_name", "").strip()
            if not name:
                return None

            return {
                "barcode": barcode,
                "name": name,
                "brand": p.get("brands", "").split(",")[0].strip() or None,
                "kcal_per_100g": nutriments.get("energy-kcal_100g", 0) or 0,
                "protein_per_100g": nutriments.get("proteins_100g", 0) or 0,
                "carbs_per_100g": nutriments.get("carbohydrates_100g", 0) or 0,
                "fat_per_100g": nutriments.get("fat_100g", 0) or 0,
                "fiber_per_100g": nutriments.get("fiber_100g", 0) or 0,
                "image_url": p.get("image_url"),
                "source": "open_food_facts",
            }
    except (httpx.RequestError, Exception):
        return None


async def cache_food_from_off(db: AsyncSession, food_data: dict) -> FoodItem:
    """Save an Open Food Facts product to local cache."""
    if food_data.get("barcode"):
        existing = await get_food_by_barcode_local(db, food_data["barcode"])
        if existing:
            return existing

    food_item = FoodItem(**food_data)
    db.add(food_item)
    await db.flush()
    await db.refresh(food_item)
    return food_item


async def create_food_item(db: AsyncSession, data: FoodItemCreate, user_id: str) -> FoodItem:
    """Create a custom food item."""
    food_item = FoodItem(
        name=data.name,
        brand=data.brand,
        barcode=data.barcode,
        kcal_per_100g=data.kcal_per_100g,
        protein_per_100g=data.protein_per_100g,
        carbs_per_100g=data.carbs_per_100g,
        fat_per_100g=data.fat_per_100g,
        fiber_per_100g=data.fiber_per_100g,
        source="manual",
        created_by=user_id,
    )
    db.add(food_item)
    await db.flush()
    await db.refresh(food_item)
    return food_item


async def get_food_by_id(db: AsyncSession, food_id: str) -> FoodItem:
    result = await db.execute(select(FoodItem).where(FoodItem.id == food_id))
    food = result.scalar_one_or_none()
    if not food:
        raise NotFoundException("Alimento")
    return food


# Favorites
async def get_user_favorites(db: AsyncSession, user_id: str) -> list[UserFavorite]:
    result = await db.execute(
        select(UserFavorite)
        .where(UserFavorite.user_id == user_id)
        .options(selectinload(UserFavorite.food_item))
        .order_by(UserFavorite.created_at.desc())
    )
    return list(result.scalars().all())


async def add_favorite(db: AsyncSession, user_id: str, food_item_id: str) -> UserFavorite:
    # Verify food exists
    await get_food_by_id(db, food_item_id)

    # Check if already favorited
    result = await db.execute(
        select(UserFavorite).where(
            UserFavorite.user_id == user_id,
            UserFavorite.food_item_id == food_item_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    favorite = UserFavorite(user_id=user_id, food_item_id=food_item_id)
    db.add(favorite)
    await db.flush()

    # Reload with food_item relationship
    result = await db.execute(
        select(UserFavorite)
        .where(UserFavorite.id == favorite.id)
        .options(selectinload(UserFavorite.food_item))
    )
    return result.scalar_one()


async def remove_favorite(db: AsyncSession, user_id: str, food_item_id: str) -> None:
    result = await db.execute(
        select(UserFavorite).where(
            UserFavorite.user_id == user_id,
            UserFavorite.food_item_id == food_item_id,
        )
    )
    favorite = result.scalar_one_or_none()
    if favorite:
        await db.delete(favorite)
