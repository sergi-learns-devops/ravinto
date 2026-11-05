from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator
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


_COMMON_PASSWORDS = {
    "password",
    "password1",
    "password123",
    "12345678",
    "123456789",
    "qwerty123",
    "iloveyou",
    "admin123",
}


# Request schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)

    @field_validator("password")
    @classmethod
    def _validate_password(cls, value: str) -> str:
        # bcrypt only considers the first 72 bytes; reject longer passwords
        # instead of silently truncating them.
        if len(value.encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar los 72 bytes")
        if value.strip() == "":
            raise ValueError("La contraseña no puede estar vacía")
        if value.lower() in _COMMON_PASSWORDS:
            raise ValueError("La contraseña es demasiado común")
        if not any(char.isalpha() for char in value) or not any(
            char.isdigit() for char in value
        ):
            raise ValueError("La contraseña debe incluir letras y números")
        return value

    @field_validator("full_name")
    @classmethod
    def _validate_full_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


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

    @field_validator("full_name")
    @classmethod
    def _validate_full_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if len(value) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return value


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
    # The refresh token is delivered as an HttpOnly cookie, never in the body.
    access_token: str
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
