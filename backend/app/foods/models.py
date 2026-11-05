import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FoodItem(Base):
    __tablename__ = "food_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    barcode: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    kcal_per_100g: Mapped[float] = mapped_column(Float, nullable=False)
    protein_per_100g: Mapped[float] = mapped_column(Float, default=0)
    carbs_per_100g: Mapped[float] = mapped_column(Float, default=0)
    fat_per_100g: Mapped[float] = mapped_column(Float, default=0)
    fiber_per_100g: Mapped[float] = mapped_column(Float, default=0)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="manual")
    created_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    meal_items = relationship("MealItem", back_populates="food_item")
    favorited_by = relationship("UserFavorite", back_populates="food_item")


class UserFavorite(Base):
    __tablename__ = "user_favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "food_item_id", name="uq_user_food_favorite"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    food_item_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("food_items.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="favorites")
    food_item = relationship("FoodItem", back_populates="favorited_by")
