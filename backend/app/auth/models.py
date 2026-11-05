import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.common.security import utcnow


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Profile fields
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # male, female, other
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # in centimeters
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # in kilograms
    goal: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # lose, maintain, gain
    activity_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # sedentary, light, moderate, active, very_active

    # Calorie goals
    daily_goal_kcal: Mapped[int] = mapped_column(Integer, default=2000)
    protein_goal_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    carbs_goal_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fat_goal_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow
    )

    # Relationships
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    """Server-side record for refresh-token rotation and revocation."""

    __tablename__ = "refresh_tokens"

    jti: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")
