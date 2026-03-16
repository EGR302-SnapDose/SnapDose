import { useEffect, useState } from 'react';
import { subscribeMeals } from '@/services/meal-service';
import { MealCarbEstimate } from '@/types/meal';

interface UseMealsReturn {
    meals: MealCarbEstimate[];
    isLoading: boolean;
    error: Error | null;
}

export function useMeals(): UseMealsReturn {
    const [meals, setMeals] = useState<MealCarbEstimate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeMeals(
            (data) => {
                setMeals(data);
                setIsLoading(false);
            },
            (err) => {
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { meals, isLoading, error };
}