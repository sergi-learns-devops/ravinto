'use client';

import { useState, useCallback } from 'react';
import { foodsService, FoodItem } from '@/services/foods.service';

export function useFoodSearch() {
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await foodsService.search(query);
      setResults(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = () => setResults([]);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
