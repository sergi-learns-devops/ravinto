import uuid
from datetime import datetime, date, time
from typing import Optional

from sqlalchemy import String, Integer, Float, Date, Time, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Workout(Base):
    __tablename__ = "workouts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    discipline: Mapped[str] = mapped_column(String(50), nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    intensity: Mapped[str] = mapped_column(String(10), nullable=False)  # low, medium, high
    workout_time: Mapped[time] = mapped_column(Time, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today, index=True)
    calories_burned: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="workouts")
