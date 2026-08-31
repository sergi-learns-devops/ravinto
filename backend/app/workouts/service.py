from datetime import date, time, datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.workouts.models import Workout
from app.workouts.schemas import (
    WorkoutCreate, WorkoutResponse, NutritionRecommendation,
    MacroSuggestion, MealExample,
)
from app.auth.models import User
from app.common.exceptions import NotFoundException, ForbiddenException

# MET values by discipline and intensity (low, medium, high)
MET_VALUES = {
    "weights":    {"low": 3.5, "medium": 5.0, "high": 6.0},
    "running":    {"low": 7.0, "medium": 9.8, "high": 12.0},
    "padel":      {"low": 4.0, "medium": 6.0, "high": 8.0},
    "crossfit":   {"low": 6.0, "medium": 8.0, "high": 12.0},
    "hyrox":      {"low": 7.0, "medium": 9.0, "high": 11.0},
    "boxing":     {"low": 5.0, "medium": 7.5, "high": 10.0},
    "swimming":   {"low": 5.0, "medium": 7.0, "high": 10.0},
    "cycling":    {"low": 4.0, "medium": 6.8, "high": 10.0},
    "yoga":       {"low": 2.5, "medium": 3.0, "high": 4.0},
    "hiit":       {"low": 6.0, "medium": 8.0, "high": 12.0},
    "functional": {"low": 4.0, "medium": 6.0, "high": 8.0},
    "other":      {"low": 4.0, "medium": 6.0, "high": 8.0},
}


def calculate_calories_burned(discipline: str, duration_min: int, intensity: str, weight_kg: float) -> float:
    """Calculate calories burned using MET formula: kcal = MET × weight_kg × duration_hours"""
    met_data = MET_VALUES.get(discipline, MET_VALUES["other"])
    met = met_data.get(intensity, met_data["medium"])
    hours = duration_min / 60
    return round(met * weight_kg * hours, 1)


async def create_workout(db: AsyncSession, data: WorkoutCreate, user: User) -> Workout:
    workout_time = time(int(data.workout_time.split(":")[0]), int(data.workout_time.split(":")[1]))
    weight = user.weight_kg or 70

    calories = calculate_calories_burned(data.discipline, data.duration_min, data.intensity, weight)

    workout = Workout(
        user_id=user.id,
        discipline=data.discipline,
        duration_min=data.duration_min,
        intensity=data.intensity,
        workout_time=workout_time,
        date=data.date or date.today(),
        calories_burned=calories,
        notes=data.notes,
    )
    db.add(workout)
    await db.flush()
    await db.refresh(workout)
    return workout


async def get_workouts_by_date(db: AsyncSession, user_id: str, target_date: date) -> list[Workout]:
    result = await db.execute(
        select(Workout)
        .where(Workout.user_id == user_id, Workout.date == target_date)
        .order_by(Workout.workout_time)
    )
    return list(result.scalars().all())


async def delete_workout(db: AsyncSession, workout_id: str, user_id: str) -> None:
    result = await db.execute(select(Workout).where(Workout.id == workout_id))
    workout = result.scalar_one_or_none()
    if not workout:
        raise NotFoundException("Entrenament")
    if workout.user_id != user_id:
        raise ForbiddenException()
    await db.delete(workout)


def get_nutrition_recommendation(workout: Workout, user: User) -> NutritionRecommendation:
    """Generate nutrition recommendation based on workout type, time of day, and intensity."""
    hour = workout.workout_time.hour
    discipline = workout.discipline
    intensity = workout.intensity
    duration = workout.duration_min

    # Determine which meal comes next
    if hour < 9:
        next_meal = "breakfast"
        time_context = "morning"
    elif hour < 14:
        next_meal = "lunch"
        time_context = "midday"
    elif hour < 18:
        next_meal = "snack_dinner"
        time_context = "afternoon"
    else:
        next_meal = "dinner"
        time_context = "evening"

    # Is this a strength or cardio workout?
    strength_disciplines = {"weights", "crossfit", "hyrox", "functional"}
    cardio_disciplines = {"running", "cycling", "swimming", "hiit"}
    is_strength = discipline in strength_disciplines
    is_cardio = discipline in cardio_disciplines
    is_light = discipline in {"yoga"} or intensity == "low"
    is_evening = hour >= 19

    # Build macros suggestion
    if is_strength:
        macros = MacroSuggestion(
            protein_priority="high",
            carbs_priority="medium" if not is_evening else "low",
            fat_priority="low",
            hydration="500-700ml water + electrolytes",
        )
    elif is_cardio:
        macros = MacroSuggestion(
            protein_priority="medium",
            carbs_priority="high" if not is_evening else "medium",
            fat_priority="low",
            hydration="600-800ml water + electrolytes",
        )
    else:
        macros = MacroSuggestion(
            protein_priority="medium",
            carbs_priority="medium",
            fat_priority="medium",
            hydration="400-500ml water",
        )

    # Generate meal examples based on context
    examples = _get_meal_examples(discipline, intensity, time_context, is_evening, is_strength, is_cardio)

    # Summary and details
    summary, details = _get_recommendation_text(
        discipline, intensity, duration, time_context, is_evening, is_strength, is_cardio
    )

    # Timing
    if is_evening:
        timing = "30-60 min after training, at least 1.5h before bed"
    else:
        timing = "30-45 min after training"

    return NutritionRecommendation(
        meal_type=next_meal,
        summary=summary,
        details=details,
        macros=macros,
        meal_examples=examples,
        timing=timing,
    )


def _get_recommendation_text(discipline, intensity, duration, time_context, is_evening, is_strength, is_cardio):
    if is_evening and is_strength:
        summary = "Light dinner, high in protein"
        details = (
            f"After {duration} min of {discipline} in the evening, your muscles need protein for recovery. "
            "Keep it light to ensure good sleep — avoid heavy carbs and fats. "
            "Prioritize lean protein + vegetables."
        )
    elif is_evening and is_cardio:
        summary = "Light recovery dinner"
        details = (
            f"After {duration} min of {discipline} at night, replenish glycogen with moderate carbs "
            "but keep it light. A balanced meal with lean protein + complex carbs + vegetables "
            "will help recovery without disrupting sleep."
        )
    elif is_evening:
        summary = "Light balanced dinner"
        details = (
            f"After {discipline} in the evening, a light meal is best for rest. "
            "Focus on easy-to-digest foods with moderate protein."
        )
    elif is_strength and time_context == "morning":
        summary = "Protein-rich breakfast with carbs"
        details = (
            f"After {duration} min of {discipline}, your body needs protein for muscle repair "
            "and carbs to replenish energy. A solid breakfast is key for recovery."
        )
    elif is_cardio and time_context == "morning":
        summary = "Carb-rich breakfast for recovery"
        details = (
            f"After {duration} min of {discipline}, replenish glycogen stores with carbohydrates. "
            "Add moderate protein and hydrate well."
        )
    elif is_strength:
        summary = "High-protein meal with moderate carbs"
        details = (
            f"After {duration} min of {discipline}, prioritize protein (30-40g) with complex carbs "
            "for optimal muscle recovery and growth."
        )
    elif is_cardio:
        summary = "Balanced recovery meal"
        details = (
            f"After {duration} min of {discipline}, your body needs carbs to refuel and moderate protein. "
            "Include antioxidant-rich foods for recovery."
        )
    else:
        summary = "Balanced nutritious meal"
        details = (
            f"After {duration} min of {discipline}, a balanced meal with protein, carbs and healthy fats "
            "will support your recovery."
        )

    return summary, details


def _get_meal_examples(discipline, intensity, time_context, is_evening, is_strength, is_cardio):
    examples = []

    if is_evening and is_strength:
        examples = [
            MealExample(
                name="Grilled chicken with vegetables",
                description="Grilled chicken breast (150g) + steamed broccoli + roasted zucchini",
                approx_kcal=350,
                highlight="High protein, low fat, easy to digest before sleep",
            ),
            MealExample(
                name="Greek yogurt with nuts",
                description="Greek yogurt (200g) + handful of walnuts + cinnamon",
                approx_kcal=280,
                highlight="Casein protein for overnight recovery",
            ),
            MealExample(
                name="Salmon with quinoa",
                description="Baked salmon (120g) + small portion of quinoa (80g) + spinach salad",
                approx_kcal=400,
                highlight="Omega-3 for inflammation + complete protein",
            ),
        ]
    elif is_evening and is_cardio:
        examples = [
            MealExample(
                name="Turkey wrap",
                description="Whole wheat wrap + turkey breast (100g) + avocado + mixed greens",
                approx_kcal=380,
                highlight="Light carbs + lean protein for glycogen replenishment",
            ),
            MealExample(
                name="Vegetable omelette",
                description="3-egg omelette + mushrooms + peppers + tomato + small toast",
                approx_kcal=350,
                highlight="Easy to digest, good protein, moderate carbs",
            ),
            MealExample(
                name="Tuna salad bowl",
                description="Tuna (130g) + sweet potato (100g) + mixed salad + olive oil",
                approx_kcal=420,
                highlight="Anti-inflammatory omega-3 + complex carbs",
            ),
        ]
    elif is_evening:
        examples = [
            MealExample(
                name="Cream of vegetable soup + egg",
                description="Pumpkin or zucchini soup + 2 boiled eggs + whole wheat toast",
                approx_kcal=320,
                highlight="Light, warm, easy to digest before sleep",
            ),
            MealExample(
                name="Cottage cheese with fruit",
                description="Cottage cheese (200g) + berries + honey drizzle",
                approx_kcal=250,
                highlight="Slow-release protein for overnight recovery",
            ),
        ]
    elif is_strength and time_context == "morning":
        examples = [
            MealExample(
                name="Protein oatmeal",
                description="Oats (80g) + protein powder (30g) + banana + peanut butter",
                approx_kcal=520,
                highlight="Complex carbs + 40g protein for muscle recovery",
            ),
            MealExample(
                name="Eggs + avocado toast",
                description="3 scrambled eggs + avocado toast on whole wheat + orange juice",
                approx_kcal=550,
                highlight="Complete amino acids + healthy fats + vitamin C",
            ),
            MealExample(
                name="Protein pancakes",
                description="Oat and banana pancakes (3) + Greek yogurt + berries + honey",
                approx_kcal=480,
                highlight="Tasty recovery breakfast with balanced macros",
            ),
        ]
    elif is_cardio and time_context == "morning":
        examples = [
            MealExample(
                name="Smoothie bowl",
                description="Banana + berries + oats + protein powder + granola topping",
                approx_kcal=450,
                highlight="Fast carbs for glycogen + protein for recovery",
            ),
            MealExample(
                name="Toast with PB and banana",
                description="2 whole wheat toasts + peanut butter + banana slices + honey",
                approx_kcal=420,
                highlight="Quick energy replenishment + potassium",
            ),
        ]
    elif is_strength:
        examples = [
            MealExample(
                name="Chicken rice bowl",
                description="Grilled chicken (150g) + brown rice (150g) + avocado + vegetables",
                approx_kcal=580,
                highlight="Classic muscle-building meal: high protein + complex carbs",
            ),
            MealExample(
                name="Lentil pasta with turkey",
                description="Lentil pasta (100g) + turkey mince (120g) + tomato sauce + parmesan",
                approx_kcal=520,
                highlight="Double protein source + fiber-rich carbs",
            ),
            MealExample(
                name="Tuna rice cakes",
                description="Rice cakes (4) + tuna (150g) + hummus + cucumber",
                approx_kcal=400,
                highlight="Quick post-workout: fast carbs + lean protein",
            ),
        ]
    elif is_cardio:
        examples = [
            MealExample(
                name="Poke bowl",
                description="Sushi rice + salmon (120g) + edamame + mango + soy sauce",
                approx_kcal=520,
                highlight="Carbs to refuel + omega-3 for inflammation",
            ),
            MealExample(
                name="Pasta with vegetables",
                description="Whole wheat pasta (100g) + grilled vegetables + chicken (100g) + olive oil",
                approx_kcal=550,
                highlight="Glycogen replenishment + moderate protein",
            ),
        ]
    else:
        examples = [
            MealExample(
                name="Mediterranean salad with protein",
                description="Mixed greens + feta + chickpeas + olives + grilled chicken + vinaigrette",
                approx_kcal=420,
                highlight="Balanced macros, antioxidants, easy to prepare",
            ),
            MealExample(
                name="Veggie wrap",
                description="Whole wheat wrap + hummus + grilled vegetables + feta cheese",
                approx_kcal=380,
                highlight="Light, nutritious and balanced",
            ),
        ]

    return examples
