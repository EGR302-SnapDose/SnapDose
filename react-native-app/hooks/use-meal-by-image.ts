import { useEffect, useState } from 'react';
import { subscribeMealByImagePath } from '@/services/meal-service';
import { MealCarbEstimate } from '@/types/meal';

interface UseMealByImageReturn {
  meal: MealCarbEstimate | null;
  isLoading: boolean;
  error: Error | null;
}

export function useMealByImage(imagePath: string): UseMealByImageReturn {
  const [meal, setMeal] = useState<MealCarbEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imagePath) return;

    const unsubscribe = subscribeMealByImagePath(
      imagePath,
      (data) => {
        setMeal(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [imagePath]);

  return { meal, isLoading, error };
}