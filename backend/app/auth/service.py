from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.schemas import UserRegister, UserUpdate, BMRResponse
from app.common.security import hash_password, verify_password
from app.common.exceptions import UserAlreadyExistsException, CredentialsException


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, data: UserRegister) -> User:
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise UserAlreadyExistsException()

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise CredentialsException()
    if not user.is_active:
        raise CredentialsException()
    return user


async def update_user(db: AsyncSession, user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.flush()
    await db.refresh(user)
    return user


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
