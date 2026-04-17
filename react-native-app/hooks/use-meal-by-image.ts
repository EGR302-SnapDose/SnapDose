import { useEffect, useState } from 'react';
import { subscribeMealByImagePath } from '@/services/meal-service';
import { MealCarbEstimate } from '@/types/meal';

export type MealStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'error' | null;

interface UseMealByImageReturn {
  meal: MealCarbEstimate | null;
  isLoading: boolean;
  error: Error | null;
  status: MealStatus;
}

export function useMealByImage(imagePath: string): UseMealByImageReturn {
  const [meal, setMeal] = useState<MealCarbEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<MealStatus>(null);

  useEffect(() => {
    if (!imagePath) return;

    const unsubscribe = subscribeMealByImagePath(
      imagePath,
      (data) => {
        setMeal(data);
        setStatus((data?.status as MealStatus) ?? null);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setStatus('error');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [imagePath]);

  return { meal, isLoading, error, status };
}