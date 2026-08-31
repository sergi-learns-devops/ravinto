from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"


class Goal(str, Enum):
    lose = "lose"
    maintain = "maintain"
    gain = "gain"


class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    active = "active"
    very_active = "very_active"


# Request schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=13, le=120)
    gender: Optional[Gender] = None
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    weight_kg: Optional[float] = Field(None, ge=20, le=500)
    goal: Optional[Goal] = None
    activity_level: Optional[ActivityLevel] = None
    daily_goal_kcal: Optional[int] = Field(None, ge=500, le=10000)
    protein_goal_g: Optional[int] = Field(None, ge=0, le=1000)
    carbs_goal_g: Optional[int] = Field(None, ge=0, le=2000)
    fat_goal_g: Optional[int] = Field(None, ge=0, le=500)


# Response schemas
class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    goal: Optional[str] = None
    activity_level: Optional[str] = None
    daily_goal_kcal: int
    protein_goal_g: Optional[int] = None
    carbs_goal_g: Optional[int] = None
    fat_goal_g: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class BMRResponse(BaseModel):
    bmr: float  # Basal Metabolic Rate
    tdee: float  # Total Daily Energy Expenditure
    recommended_kcal: float  # Adjusted for goal
    recommended_protein_g: int
    recommended_carbs_g: int
    recommended_fat_g: int
    formula: str  # Which formula was used
    message: str  # Friendly message
