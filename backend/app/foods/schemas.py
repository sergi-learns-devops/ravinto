from __future__ import annotations

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# Request schemas
class FoodItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    brand: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=50)
    kcal_per_100g: float = Field(ge=0, le=10000)
    protein_per_100g: float = Field(ge=0, le=1000, default=0)
    carbs_per_100g: float = Field(ge=0, le=1000, default=0)
    fat_per_100g: float = Field(ge=0, le=1000, default=0)
    fiber_per_100g: float = Field(ge=0, le=1000, default=0)


# Response schemas
class FoodItemResponse(BaseModel):
    id: str
    barcode: Optional[str] = None
    name: str
    brand: Optional[str] = None
    kcal_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    fiber_per_100g: float
    image_url: Optional[str] = None
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class FoodSearchResult(BaseModel):
    items: list[FoodItemResponse]
    total: int
    source: str  # 'local' | 'open_food_facts' | 'mixed'


class FavoriteResponse(BaseModel):
    id: str
    food_item: FoodItemResponse
    created_at: datetime

    class Config:
        from_attributes = True
