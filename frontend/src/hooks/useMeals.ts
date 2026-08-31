'use client';

import { useState, useEffect, useCallback } from 'react';
import { mealsService, DailySummary, CreateMealData } from '@/services/meals.service';

export function useMeals(date?: string) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mealsService.getDailySummary(date);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar comidas');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const createMeal = async (data: CreateMealData) => {
    try {
      await mealsService.createMeal(data);
      await fetchSummary();
    } catch (err) {
      throw err;
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      await mealsService.deleteMeal(mealId);
      await fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  return {
    summary,
    loading,
    error,
    createMeal,
    deleteMeal,
    refresh: fetchSummary,
  };
}
