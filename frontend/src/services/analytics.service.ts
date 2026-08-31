import { api } from './api';

export interface WeeklySummary {
  start_date: string;
  end_date: string;
  days: { date: string; total_kcal: number; items_count: number }[];
  total_kcal: number;
  average_kcal: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  days: { date: string; total_kcal: number }[];
  total_kcal: number;
  average_kcal: number;
  days_tracked: number;
  days_in_month: number;
}

export const analyticsService = {
  async getWeekly(startDate?: string): Promise<WeeklySummary> {
    const params = startDate ? `?start_date=${startDate}` : '';
    return api.get<WeeklySummary>(`/api/analytics/weekly${params}`);
  },

  async getMonthly(year: number, month: number): Promise<MonthlySummary> {
    return api.get<MonthlySummary>(`/api/analytics/monthly?year=${year}&month=${month}`);
  },

  async getStreak(): Promise<{ streak_days: number }> {
    return api.get('/api/analytics/streak');
  },

  async getMacros(date?: string): Promise<{
    date: string;
    total_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }> {
    const params = date ? `?date=${date}` : '';
    return api.get(`/api/analytics/macros${params}`);
  },
};
