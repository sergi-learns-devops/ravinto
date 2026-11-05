import csv
import io
import uuid
from datetime import date
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.auth import service
from app.auth.schemas import (
    UserRegister,
    UserLogin,
    UserUpdate,
    UserResponse,
    TokenResponse,
    AccessTokenResponse,
    BMRResponse,
)
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.common.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    refresh_token_expiry,
)
from app.common.rate_limit import (
    export_rate_limit,
    login_rate_limit,
    refresh_rate_limit,
    register_rate_limit,
)
from app.common.exceptions import CredentialsException

settings = get_settings()

router = APIRouter(prefix="/api/auth", tags=["auth"])

REFRESH_COOKIE_PATH = "/api/auth"


def _set_refresh_cookie(response: Response, token: str) -> None:
    max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path=REFRESH_COOKIE_PATH,
    )
    # Non-sensitive marker so the frontend middleware (which runs on another
    # origin/port) can perform a UX-level redirect. It carries no credentials.
    response.set_cookie(
        key=settings.SESSION_MARKER_COOKIE_NAME,
        value="1",
        max_age=max_age,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
    response.delete_cookie(settings.SESSION_MARKER_COOKIE_NAME, path="/")


def _csv_safe(value) -> str:
    """Neutralize spreadsheet formula injection and normalize values."""
    if value is None:
        return ""
    text = str(value)
    if text.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + text
    return text


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    dependencies=[Depends(register_rate_limit)],
)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    user = await service.create_user(db, data)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(login_rate_limit)],
)
async def login(
    data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await service.authenticate_user(db, data.email, data.password)

    jti = str(uuid.uuid4())
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id}, jti=jti)

    await service.create_refresh_token_record(
        db, user.id, jti, refresh_token_expiry()
    )
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token)


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    dependencies=[Depends(refresh_rate_limit)],
)
async def refresh_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if not token:
        raise CredentialsException()

    payload = decode_token(token, expected_type="refresh")
    if payload is None:
        raise CredentialsException()

    user_id = payload.get("sub")
    old_jti = payload.get("jti")
    user = await service.get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise CredentialsException()

    new_jti = str(uuid.uuid4())
    await service.rotate_refresh_token(
        db,
        jti=old_jti,
        user_id=user.id,
        new_jti=new_jti,
        new_expires_at=refresh_token_expiry(),
    )

    new_refresh_token = create_refresh_token(data={"sub": user.id}, jti=new_jti)
    _set_refresh_cookie(response, new_refresh_token)
    return AccessTokenResponse(access_token=create_access_token(data={"sub": user.id}))


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if token:
        payload = decode_token(token, expected_type="refresh")
        if payload and payload.get("sub") and payload.get("jti"):
            await service.revoke_refresh_token(db, payload["jti"], payload["sub"])
    _clear_refresh_cookie(response)


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
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete user account and all associated data (meals, favorites, etc.)."""
    await service.delete_user_account(db, current_user)
    _clear_refresh_cookie(response)


@router.get(
    "/me/export",
    dependencies=[Depends(export_rate_limit)],
)
async def export_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all user data as CSV (GDPR compliant)."""
    from app.meals.models import Meal, MealItem

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
                _csv_safe(meal.date.isoformat()),
                _csv_safe(meal.meal_type),
                _csv_safe(food.name),
                _csv_safe(food.brand),
                _csv_safe(round(item.quantity_grams, 1)),
                _csv_safe(round(item.kcal_total, 1)),
                _csv_safe(round(food.protein_per_100g * ratio, 1)),
                _csv_safe(round(food.carbs_per_100g * ratio, 1)),
                _csv_safe(round(food.fat_per_100g * ratio, 1)),
                _csv_safe(round(food.fiber_per_100g * ratio, 1)),
            ])

    output.seek(0)
    # The filename is built from the opaque user id, never from user-controlled
    # text (a full name could otherwise inject headers).
    filename = f"ravinto_export_{current_user.id}_{date.today().isoformat()}.csv"
    disposition = (
        f"attachment; filename=\"{filename}\"; "
        f"filename*=UTF-8''{quote(filename)}"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": disposition},
    )
