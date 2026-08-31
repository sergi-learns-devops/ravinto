from __future__ import annotations

from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional
from enum import Enum


class Intensity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class WorkoutCreate(BaseModel):
    discipline: str = Field(min_length=1, max_length=50)
    duration_min: int = Field(ge=1, le=600)
    intensity: Intensity
    workout_time: str = Field(pattern=r'^\d{2}:\d{2}$')  # HH:MM
    date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=500)


class WorkoutResponse(BaseModel):
    id: str
    discipline: str
    duration_min: int
    intensity: str
    workout_time: str
    date: date
    calories_burned: float
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MacroSuggestion(BaseModel):
    protein_priority: str
    carbs_priority: str
    fat_priority: str
    hydration: str


class MealExample(BaseModel):
    name: str
    description: str
    approx_kcal: int
    highlight: str


class NutritionRecommendation(BaseModel):
    meal_type: str
    summary: str
    details: str
    macros: MacroSuggestion
    meal_examples: list[MealExample]
    timing: str
