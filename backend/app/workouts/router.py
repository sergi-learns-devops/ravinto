from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.workouts import service
from app.workouts.schemas import WorkoutCreate, WorkoutResponse, NutritionRecommendation

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


@router.post("/", response_model=WorkoutResponse, status_code=201)
async def create_workout(
    data: WorkoutCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a workout."""
    workout = await service.create_workout(db, data, current_user)
    return WorkoutResponse(
        id=workout.id,
        discipline=workout.discipline,
        duration_min=workout.duration_min,
        intensity=workout.intensity,
        workout_time=workout.workout_time.strftime("%H:%M"),
        date=workout.date,
        calories_burned=workout.calories_burned,
        notes=workout.notes,
        created_at=workout.created_at,
    )


@router.get("/daily", response_model=list[WorkoutResponse])
async def get_daily_workouts(
    target_date: date = Query(default=None, alias="date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all workouts for a specific day."""
    if target_date is None:
        target_date = date.today()

    workouts = await service.get_workouts_by_date(db, current_user.id, target_date)
    return [
        WorkoutResponse(
            id=w.id,
            discipline=w.discipline,
            duration_min=w.duration_min,
            intensity=w.intensity,
            workout_time=w.workout_time.strftime("%H:%M"),
            date=w.date,
            calories_burned=w.calories_burned,
            notes=w.notes,
            created_at=w.created_at,
        )
        for w in workouts
    ]


@router.get("/{workout_id}/recommendation", response_model=NutritionRecommendation)
async def get_recommendation(
    workout_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get nutrition recommendation for a specific workout."""
    from sqlalchemy import select
    from app.workouts.models import Workout
    from app.common.exceptions import NotFoundException, ForbiddenException

    result = await db.execute(select(Workout).where(Workout.id == workout_id))
    workout = result.scalar_one_or_none()
    if not workout:
        raise NotFoundException("Entrenament")
    if workout.user_id != current_user.id:
        raise ForbiddenException()

    return service.get_nutrition_recommendation(workout, current_user)


@router.delete("/{workout_id}", status_code=204)
async def delete_workout(
    workout_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a workout."""
    await service.delete_workout(db, workout_id, current_user.id)
