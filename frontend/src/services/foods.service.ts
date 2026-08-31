import { api } from './api';

export interface FoodItem {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  image_url: string | null;
  source: string;
  created_at: string;
}

export interface FoodSearchResult {
  items: FoodItem[];
  total: number;
  source: string;
}

export interface CreateFoodData {
  name: string;
  brand?: string;
  barcode?: string;
  kcal_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
}

export const foodsService = {
  async search(query: string): Promise<FoodSearchResult> {
    return api.get<FoodSearchResult>(`/api/foods/search?q=${encodeURIComponent(query)}`);
  },

  async getByBarcode(barcode: string): Promise<FoodItem> {
    return api.get<FoodItem>(`/api/foods/barcode/${barcode}`);
  },

  async create(data: CreateFoodData): Promise<FoodItem> {
    return api.post<FoodItem>('/api/foods/', data);
  },

  async getFavorites(): Promise<{ id: string; food_item: FoodItem; created_at: string }[]> {
    return api.get('/api/foods/favorites/list');
  },

  async addFavorite(foodItemId: string): Promise<void> {
    return api.post(`/api/foods/favorites/${foodItemId}`);
  },

  async removeFavorite(foodItemId: string): Promise<void> {
    return api.delete(`/api/foods/favorites/${foodItemId}`);
  },
};
