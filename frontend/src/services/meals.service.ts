import { api } from './api';

export interface MealItem {
  id: string;
  food_item_id: string;
  food_name: string;
  food_brand: string | null;
  quantity_grams: number;
  kcal_total: number;
  protein_total: number;
  carbs_total: number;
  fat_total: number;
}

export interface Meal {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  notes: string | null;
  items: MealItem[];
  total_kcal: number;
  created_at: string;
}

export interface DailySummary {
  date: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  goal_kcal: number;
  meals: Meal[];
  meals_count: number;
}

export interface CreateMealData {
  meal_type: string;
  date?: string;
  notes?: string;
  items: { food_item_id: string; quantity_grams: number }[];
}

export const mealsService = {
  async getDailySummary(date?: string): Promise<DailySummary> {
    const params = date ? `?date=${date}` : '';
    return api.get<DailySummary>(`/api/meals/daily${params}`);
  },

  async createMeal(data: CreateMealData): Promise<Meal> {
    return api.post<Meal>('/api/meals/', data);
  },

  async deleteMeal(mealId: string): Promise<void> {
    return api.delete(`/api/meals/${mealId}`);
  },

  async deleteMealItem(itemId: string): Promise<void> {
    return api.delete(`/api/meals/items/${itemId}`);
  },
};
