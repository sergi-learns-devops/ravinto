from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.foods import service
from app.foods.schemas import (
    FoodItemCreate,
    FoodItemResponse,
    FoodSearchResult,
    FavoriteResponse,
)

router = APIRouter(prefix="/api/foods", tags=["foods"])


@router.get("/search", response_model=FoodSearchResult)
async def search_foods(
    q: str = Query(min_length=2, max_length=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search foods in local DB first, then Open Food Facts if needed."""
    # Search locally first
    local_results = await service.search_foods_local(db, q, current_user.id)

    if len(local_results) >= 5:
        return FoodSearchResult(
            items=local_results,
            total=len(local_results),
            source="local",
        )

    # Not enough local results, search Open Food Facts
    off_results = await service.search_foods_openfoodfacts(q)

    # Cache OFF results in local DB
    cached_items = []
    for food_data in off_results:
        cached = await service.cache_food_from_off(db, food_data)
        # Do not expose another user's private custom food.
        if cached is not None and cached.created_by in (None, current_user.id):
            cached_items.append(cached)

    # Combine: local first, then OFF results (dedup by barcode)
    local_barcodes = {f.barcode for f in local_results if f.barcode}
    combined = list(local_results)
    for item in cached_items:
        if item.barcode not in local_barcodes and item.id not in {f.id for f in combined}:
            combined.append(item)

    source = "local" if not off_results else ("mixed" if local_results else "open_food_facts")

    return FoodSearchResult(
        items=combined[:20],
        total=len(combined),
        source=source,
    )


@router.get("/barcode/{barcode}", response_model=FoodItemResponse)
async def get_by_barcode(
    barcode: str = Path(..., min_length=8, max_length=14, pattern=r"^\d{8,14}$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get food by barcode. Checks local cache first, then Open Food Facts."""
    # Check local first
    food = await service.get_food_by_barcode_local(db, barcode, current_user.id)
    if food:
        return food

    # Try Open Food Facts
    off_data = await service.get_food_by_barcode_openfoodfacts(barcode)
    if off_data:
        cached = await service.cache_food_from_off(db, off_data)
        if cached and cached.created_by in (None, current_user.id):
            return cached

    from app.common.exceptions import NotFoundException
    raise NotFoundException("Alimento con ese código de barras")


@router.post("/", response_model=FoodItemResponse, status_code=201)
async def create_food(
    data: FoodItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a custom food item."""
    food = await service.create_food_item(db, data, current_user.id)
    return food


@router.get("/{food_id}", response_model=FoodItemResponse)
async def get_food(
    food_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a food item by ID."""
    return await service.get_food_by_id(db, food_id, current_user.id)


# Favorites
@router.get("/favorites/list", response_model=list[FavoriteResponse])
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's favorite foods."""
    return await service.get_user_favorites(db, current_user.id)


@router.post("/favorites/{food_item_id}", response_model=FavoriteResponse, status_code=201)
async def add_to_favorites(
    food_item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a food to favorites."""
    return await service.add_favorite(db, current_user.id, food_item_id)


@router.delete("/favorites/{food_item_id}", status_code=204)
async def remove_from_favorites(
    food_item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a food from favorites."""
    await service.remove_favorite(db, current_user.id, food_item_id)
