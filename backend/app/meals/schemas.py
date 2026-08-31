from __future__ import annotations

from pydantic import BaseModel, Field
from datetime import date, datetime
from enum import Enum
from typing import Optional


class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


# Request schemas
class MealItemCreate(BaseModel):
    food_item_id: str
    quantity_grams: float = Field(gt=0, le=5000)


class MealCreate(BaseModel):
    meal_type: MealType
    date: Optional[date] = None  # defaults to today
    notes: Optional[str] = Field(None, max_length=500)
    items: list[MealItemCreate] = Field(min_length=1)


class MealItemAdd(BaseModel):
    food_item_id: str
    quantity_grams: float = Field(gt=0, le=5000)


# Response schemas
class MealItemResponse(BaseModel):
    id: str
    food_item_id: str
    food_name: str
    food_brand: Optional[str] = None
    quantity_grams: float
    kcal_total: float
    protein_total: float
    carbs_total: float
    fat_total: float

    class Config:
        from_attributes = True


class MealResponse(BaseModel):
    id: str
    meal_type: MealType
    date: date
    notes: Optional[str] = None
    items: list[MealItemResponse]
    total_kcal: float
    created_at: datetime

    class Config:
        from_attributes = True


class DailySummary(BaseModel):
    date: date
    total_kcal: float
    total_protein: float
    total_carbs: float
    total_fat: float
    goal_kcal: int
    meals: list[MealResponse]
    meals_count: int
