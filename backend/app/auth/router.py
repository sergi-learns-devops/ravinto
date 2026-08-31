from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import service
from app.auth.schemas import (
    UserRegister,
    UserLogin,
    UserUpdate,
    UserResponse,
    TokenResponse,
    AccessTokenResponse,
    RefreshTokenRequest,
    BMRResponse,
)
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.common.security import create_access_token, create_refresh_token, decode_token
from app.common.exceptions import CredentialsException

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    user = await service.create_user(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await service.authenticate_user(db, data.email, data.password)
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise CredentialsException()

    user_id = payload.get("sub")
    user = await service.get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise CredentialsException()

    new_access_token = create_access_token(data={"sub": user.id})
    return AccessTokenResponse(access_token=new_access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await service.update_user(db, current_user, data)
    return updated


@router.get("/me/recommendations", response_model=BMRResponse)
async def get_recommendations(current_user: User = Depends(get_current_user)):
    """Calculate BMR, TDEE and recommended calories based on user profile."""
    result = service.calculate_bmr_tdee(current_user)
    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Completa tu perfil (edad, género, altura y peso) para obtener recomendaciones personalizadas",
        )
    return result


@router.post("/me/apply-recommendations", response_model=UserResponse)
async def apply_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate and apply recommended calorie/macro goals to user profile."""
    result = service.calculate_bmr_tdee(current_user)
    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Completa tu perfil (edad, género, altura y peso) para aplicar recomendaciones",
        )

    update_data = UserUpdate(
        daily_goal_kcal=int(result.recommended_kcal),
        protein_goal_g=result.recommended_protein_g,
        carbs_goal_g=result.recommended_carbs_g,
        fat_goal_g=result.recommended_fat_g,
    )
    updated = await service.update_user(db, current_user, update_data)
    return updated


@router.delete("/me", status_code=204)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete user account and all associated data (meals, favorites, etc.)."""
    await db.delete(current_user)
    await db.flush()


@router.get("/me/export")
async def export_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all user data as CSV (GDPR compliant)."""
    import csv
    import io
    from fastapi.responses import StreamingResponse
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.meals.models import Meal, MealItem
    from app.foods.models import FoodItem

    # Fetch all meals with items
    result = await db.execute(
        select(Meal)
        .where(Meal.user_id == current_user.id)
        .options(selectinload(Meal.items).selectinload(MealItem.food_item))
        .order_by(Meal.date.desc(), Meal.created_at.desc())
    )
    meals = result.scalars().all()

    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date", "meal_type", "food_name", "food_brand",
        "quantity_grams", "kcal", "protein_g", "carbs_g", "fat_g", "fiber_g"
    ])

    for meal in meals:
        for item in meal.items:
            food = item.food_item
            ratio = item.quantity_grams / 100
            writer.writerow([
                meal.date.isoformat(),
                meal.meal_type,
                food.name,
                food.brand or "",
                round(item.quantity_grams, 1),
                round(item.kcal_total, 1),
                round(food.protein_per_100g * ratio, 1),
                round(food.carbs_per_100g * ratio, 1),
                round(food.fat_per_100g * ratio, 1),
                round(food.fiber_per_100g * ratio, 1),
            ])

    output.seek(0)
    filename = f"ravinto_export_{current_user.full_name.replace(' ', '_')}_{__import__('datetime').date.today().isoformat()}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
