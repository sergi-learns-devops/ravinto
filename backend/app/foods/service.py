from typing import Optional
from urllib.parse import quote

import httpx
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.foods.models import FoodItem, UserFavorite
from app.foods.schemas import FoodItemCreate
from app.common.exceptions import NotFoundException, ConflictException

settings = get_settings()


def _escape_like(value: str) -> str:
    """Escape LIKE wildcards so user input is treated literally."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _to_float(value, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _clean_text(value, max_length: int) -> Optional[str]:
    if not isinstance(value, str):
        return None
    value = value.strip()
    return value[:max_length] or None


async def search_foods_local(
    db: AsyncSession, query: str, user_id: Optional[str] = None, limit: int = 20
) -> list[FoodItem]:
    """Search foods in local database.

    Global foods (Open Food Facts) and the user's own custom foods are visible;
    custom foods created by other users are not.
    """
    conditions = [FoodItem.name.ilike(f"%{_escape_like(query)}%", escape="\\")]
    if user_id is not None:
        conditions.append(
            or_(FoodItem.created_by.is_(None), FoodItem.created_by == user_id)
        )

    result = await db.execute(
        select(FoodItem)
        .where(*conditions)
        .order_by(FoodItem.name)
        .limit(limit)
    )
    return list(result.scalars().all())


def _off_product_to_dict(product: dict, fallback_barcode: Optional[str] = None) -> Optional[dict]:
    """Validate and normalize a product returned by Open Food Facts."""
    if not isinstance(product, dict):
        return None

    name = _clean_text(product.get("product_name"), 200)
    if not name:
        return None

    nutriments = product.get("nutriments") or {}
    if not isinstance(nutriments, dict):
        nutriments = {}

    barcode = product.get("code") or fallback_barcode
    barcode = str(barcode).strip()[:50] if barcode else None

    brands = product.get("brands")
    brand = _clean_text(brands.split(",")[0], 100) if isinstance(brands, str) else None

    return {
        "barcode": barcode,
        "name": name,
        "brand": brand,
        "kcal_per_100g": _to_float(nutriments.get("energy-kcal_100g")),
        "protein_per_100g": _to_float(nutriments.get("proteins_100g")),
        "carbs_per_100g": _to_float(nutriments.get("carbohydrates_100g")),
        "fat_per_100g": _to_float(nutriments.get("fat_100g")),
        "fiber_per_100g": _to_float(nutriments.get("fiber_100g")),
        "image_url": _clean_text(product.get("image_url"), 500),
        "source": "open_food_facts",
    }


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
            if not isinstance(products, list):
                return []

            results = []
            for product in products:
                normalized = _off_product_to_dict(product)
                if normalized:
                    results.append(normalized)

            return results
    except (httpx.HTTPError, ValueError):
        return []


async def get_food_by_barcode_local(
    db: AsyncSession, barcode: str, user_id: Optional[str] = None
) -> Optional[FoodItem]:
    """Get food by barcode from local database."""
    conditions = [FoodItem.barcode == barcode]
    if user_id is not None:
        conditions.append(
            or_(FoodItem.created_by.is_(None), FoodItem.created_by == user_id)
        )
    result = await db.execute(select(FoodItem).where(*conditions))
    return result.scalar_one_or_none()


async def get_food_by_barcode_openfoodfacts(barcode: str) -> Optional[dict]:
    """Get food by barcode from Open Food Facts."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.OFF_API_URL}/product/{quote(barcode, safe='')}",
                params={"fields": "code,product_name,brands,nutriments,image_url"},
            )
            if response.status_code != 200:
                return None

            data = response.json()
            if data.get("status") != 1:
                return None

            product = data.get("product")
            if not isinstance(product, dict):
                return None

            return _off_product_to_dict(product, fallback_barcode=barcode)
    except (httpx.HTTPError, ValueError):
        return None


async def cache_food_from_off(db: AsyncSession, food_data: dict) -> Optional[FoodItem]:
    """Save an Open Food Facts product to local cache.

    Products without a barcode are not cached (they cannot be de-duplicated).
    Concurrent inserts of the same barcode are handled gracefully.
    """
    barcode = food_data.get("barcode")
    if not barcode:
        return None

    existing = await get_food_by_barcode_local(db, barcode)
    if existing:
        return existing

    food_item = FoodItem(**food_data)
    try:
        async with db.begin_nested():
            db.add(food_item)
            await db.flush()
    except IntegrityError:
        # Another request inserted the same barcode concurrently.
        existing = await get_food_by_barcode_local(db, barcode)
        if existing:
            return existing
        raise

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
    try:
        async with db.begin_nested():
            db.add(food_item)
            await db.flush()
    except IntegrityError:
        raise ConflictException("Ya existe un alimento con ese código de barras")

    await db.refresh(food_item)
    await db.commit()
    return food_item


async def get_food_by_id(
    db: AsyncSession, food_id: str, user_id: Optional[str] = None
) -> FoodItem:
    conditions = [FoodItem.id == food_id]
    if user_id is not None:
        conditions.append(
            or_(FoodItem.created_by.is_(None), FoodItem.created_by == user_id)
        )
    result = await db.execute(select(FoodItem).where(*conditions))
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
    # Verify food exists and is visible to this user
    await get_food_by_id(db, food_item_id, user_id)

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
    try:
        async with db.begin_nested():
            db.add(favorite)
            await db.flush()
    except IntegrityError:
        # Concurrent request added the same favorite.
        result = await db.execute(
            select(UserFavorite)
            .where(
                UserFavorite.user_id == user_id,
                UserFavorite.food_item_id == food_item_id,
            )
            .options(selectinload(UserFavorite.food_item))
        )
        return result.scalar_one()

    # Reload with food_item relationship
    result = await db.execute(
        select(UserFavorite)
        .where(UserFavorite.id == favorite.id)
        .options(selectinload(UserFavorite.food_item))
    )
    favorite = result.scalar_one()
    await db.commit()
    return favorite


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
        await db.commit()
