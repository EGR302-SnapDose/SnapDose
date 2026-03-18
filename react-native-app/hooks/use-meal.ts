import { useEffect, useState } from 'react';
import { subscribeMeal } from '@/services/meal-service';
import { MealCarbEstimate } from '@/types/meal';

interface UseMealReturn {
    meal: MealCarbEstimate | null;
    isLoading: boolean;
    error: Error | null;
}

export function useMeal(mealId: string): UseMealReturn {
    const [meal, setMeal] = useState<MealCarbEstimate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!mealId) return;

        const unsubscribe = subscribeMeal(
            mealId,
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
    }, [mealId]);

    return {meal, isLoading, error };
}