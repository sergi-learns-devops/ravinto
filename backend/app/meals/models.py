import uuid
from datetime import datetime, date
from typing import Optional

from sqlalchemy import String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    meal_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # breakfast, lunch, dinner, snack
    date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="meals")
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    meal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_item_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("food_items.id"), nullable=False
    )
    quantity_grams: Mapped[float] = mapped_column(Float, nullable=False)
    kcal_total: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    meal = relationship("Meal", back_populates="items")
    food_item = relationship("FoodItem", back_populates="meal_items")
