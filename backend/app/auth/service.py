from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.auth.models import User, RefreshToken
from app.auth.schemas import UserRegister, UserUpdate, BMRResponse
from app.common.security import hash_password, verify_password, utcnow
from app.common.exceptions import UserAlreadyExistsException, CredentialsException

# Used to keep login timing constant when the email does not exist.
_DUMMY_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i"


def normalize_email(email: str) -> str:
    return email.strip().lower()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == normalize_email(email)))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, data: UserRegister) -> User:
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise UserAlreadyExistsException()

    user = User(
        email=normalize_email(data.email),
        hashed_password=await run_in_threadpool(hash_password, data.password),
        full_name=data.full_name.strip(),
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        # Concurrent registration with the same email.
        raise UserAlreadyExistsException()
    await db.refresh(user)
    # Commit before the response is sent (the dependency teardown runs later),
    # so an immediate login/read sees the new user.
    await db.commit()
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)

    # Always run bcrypt so response time does not reveal whether the account exists.
    hashed_password = user.hashed_password if user else _DUMMY_HASH
    password_ok = await run_in_threadpool(verify_password, password, hashed_password)

    if not user or not password_ok or not user.is_active:
        raise CredentialsException()
    return user


async def update_user(db: AsyncSession, user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    if "full_name" in update_data and update_data["full_name"] is not None:
        update_data["full_name"] = update_data["full_name"].strip()
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.flush()
    await db.refresh(user)
    await db.commit()
    return user


async def delete_user_account(db: AsyncSession, user: User) -> None:
    """Delete the user and everything owned by them.

    Custom foods are kept but detached (created_by = NULL) because they may be
    referenced by meals belonging to other users.
    """
    from app.foods.models import FoodItem

    await db.execute(
        update(FoodItem)
        .where(FoodItem.created_by == user.id)
        .values(created_by=None)
    )
    await db.delete(user)
    await db.flush()
    await db.commit()


# ---------------------------------------------------------------------------
# Refresh token rotation / revocation
# ---------------------------------------------------------------------------

async def create_refresh_token_record(
    db: AsyncSession, user_id: str, jti: str, expires_at: datetime
) -> None:
    db.add(RefreshToken(jti=jti, user_id=user_id, expires_at=expires_at))
    await db.flush()
    # Persist before the response so the cookie is usable immediately.
    await db.commit()


async def get_refresh_token_record(db: AsyncSession, jti: str) -> Optional[RefreshToken]:
    result = await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
    return result.scalar_one_or_none()


async def revoke_refresh_token(db: AsyncSession, jti: str, user_id: str) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.jti == jti, RefreshToken.user_id == user_id)
        .values(revoked=True)
    )
    await db.commit()


async def revoke_all_refresh_tokens(db: AsyncSession, user_id: str) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
        .values(revoked=True)
    )
    await db.commit()


async def rotate_refresh_token(
    db: AsyncSession,
    *,
    jti: str,
    user_id: str,
    new_jti: str,
    new_expires_at: datetime,
) -> None:
    """Consume a refresh token and issue a new one.

    Reusing an already-revoked token is treated as theft and revokes every
    active token for that user.
    """
    record = await get_refresh_token_record(db, jti)
    if record is None or record.revoked:
        if record is not None:
            # A revoked token is being replayed: assume theft and invalidate
            # every active session for this user.
            await revoke_all_refresh_tokens(db, record.user_id)
        raise CredentialsException()

    if record.user_id != user_id or record.expires_at <= utcnow():
        record.revoked = True
        await db.commit()
        raise CredentialsException()

    record.revoked = True
    await create_refresh_token_record(db, user_id, new_jti, new_expires_at)


def calculate_bmr_tdee(user: User) -> Optional[BMRResponse]:
    """
    Calculate BMR using Mifflin-St Jeor equation (most accurate for most people)
    and TDEE based on activity level.
    """
    if not user.weight_kg or not user.height_cm or not user.age or not user.gender:
        return None

    # Mifflin-St Jeor Equation
    if user.gender == "male":
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) + 5
    elif user.gender == "female":
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) - 161
    else:
        # Average of male and female for "other"
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) - 78

    # Activity multipliers
    activity_multipliers = {
        "sedentary": 1.2,       # Little or no exercise
        "light": 1.375,         # Light exercise 1-3 days/week
        "moderate": 1.55,       # Moderate exercise 3-5 days/week
        "active": 1.725,        # Hard exercise 6-7 days/week
        "very_active": 1.9,     # Very hard exercise, physical job
    }

    multiplier = activity_multipliers.get(user.activity_level or "moderate", 1.55)
    tdee = bmr * multiplier

    # Adjust for goal
    goal_adjustments = {
        "lose": -500,       # ~0.5kg/week deficit
        "maintain": 0,
        "gain": 300,        # Lean gain surplus
    }

    adjustment = goal_adjustments.get(user.goal or "maintain", 0)
    recommended_kcal = max(1200, tdee + adjustment)  # Never below 1200

    # Macro distribution
    # Lose: higher protein (30%), moderate carbs (35%), moderate fat (35%)
    # Maintain: balanced (25% protein, 45% carbs, 30% fat)
    # Gain: moderate protein (25%), higher carbs (50%), moderate fat (25%)
    if user.goal == "lose":
        protein_ratio, carbs_ratio, fat_ratio = 0.30, 0.35, 0.35
    elif user.goal == "gain":
        protein_ratio, carbs_ratio, fat_ratio = 0.25, 0.50, 0.25
    else:
        protein_ratio, carbs_ratio, fat_ratio = 0.25, 0.45, 0.30

    recommended_protein = int((recommended_kcal * protein_ratio) / 4)  # 4 kcal/g
    recommended_carbs = int((recommended_kcal * carbs_ratio) / 4)      # 4 kcal/g
    recommended_fat = int((recommended_kcal * fat_ratio) / 9)          # 9 kcal/g

    # Friendly message
    goal_messages = {
        "lose": f"Para perder peso de forma saludable, te recomendamos {int(recommended_kcal)} kcal/día",
        "maintain": f"Para mantener tu peso, tu gasto calórico es de {int(recommended_kcal)} kcal/día",
        "gain": f"Para ganar masa muscular, necesitas aproximadamente {int(recommended_kcal)} kcal/día",
    }
    message = goal_messages.get(user.goal or "maintain", f"Tu gasto calórico estimado es {int(recommended_kcal)} kcal/día")

    return BMRResponse(
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
        recommended_kcal=round(recommended_kcal, 1),
        recommended_protein_g=recommended_protein,
        recommended_carbs_g=recommended_carbs,
        recommended_fat_g=recommended_fat,
        formula="Mifflin-St Jeor",
        message=message,
    )
