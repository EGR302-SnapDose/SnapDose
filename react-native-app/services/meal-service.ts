import {
    collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, Unsubscribe, Timestamp, serverTimestamp, } 
from 'firebase/firestore';
import { db } from '@/config/firebase';
import { MealCarbEstimate } from '@/types/meal';

const COLLECTION = 'meal_carb_estimates';

// Convert Firestore doc to MealCarbEstimate
const fromFirestore = (id: string, data: Record<string, any>): MealCarbEstimate => ({
    id,
    confidence: data.confidence ?? 'low',
    created_at: data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(data.created_at),
    estimated_carbs_grams: data.estimated_carbs_grams ?? 0,
    foods_detected: data.foods_detected ?? [],
    image_bucket: data.image_bucket ?? '',
    image_gs_uri: data.image_gs_uri ?? '',
    image_path: data.image_path ?? '',
    notes: data.notes ?? '',
    raw_gemini_response: data.raw_gemini_response ?? '',
    status: data.status ?? 'pending',
});

// Real-time listener for all meals, sorted by most recent
export const subscribeMeals = (
    onUpdate: (meals: MealCarbEstimate[]) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'));

    return onSnapshot(
        q, 
        (snapshot) => {
            const meals = snapshot.docs.map((doc) => fromFirestore(doc.id, doc.data()));
            onUpdate(meals);
        },
        (error) => {
            console.error('Firestore listener error:', error);
            onError?.(error);
        }
    );
};

// Real-time listener for a single meal document
export const subscribeMeal = (
    mealId: string,
    onUpdate: (meal: MealCarbEstimate | null) => void,
    onError?: (error: Error) => void
): Unsubscribe => {
    return onSnapshot(
        doc(db, COLLECTION, mealId),
        (snapshot) => {
            if(snapshot.exists()) {
                onUpdate(fromFirestore(snapshot.id, snapshot.data()));
            } else {
                onUpdate(null);
            }
        },
        (error) => {
            console.error('Firestore meal listener error:', error);
            onError?.(error);
        }
    );
};

// Create a new meal entry
export const createMealEntry = async (imagePath: string, imageBucket: string, imageGsUri: string,): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTION), {
        status: 'pending',
        image_path: imagePath,
        image_bucket: imageBucket,
        image_gs_uri: imageGsUri,
        estimated_carbs_grams: 0,
        confidence: 'low',
        foods_detected: [],
        notes: '',
        raw_gemini_response: '',
        creaed_at: serverTimestamp(),
    });
    return docRef.id;
};

// Update carb estimate (user override)
export const updateCarbEstimate = async( mealId: string, carbs: number): Promise<void> => {
    await updateDoc(doc(db, COLLECTION, mealId), {
        estimated_carbs_grams: carbs,
    });
};

// Delete a meal entry
export const deleteMealentry = async (mealId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTION, mealId));
};