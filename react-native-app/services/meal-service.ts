import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  Unsubscribe,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/config/firebase';
import { MealCarbEstimate } from '@/types/meal';

const COLLECTION = 'meal_carb_estimation';

const getMealCollection = () => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  return collection(db, 'users', userId, COLLECTION);
};

const getMealDoc = (mealId: string) => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  return doc(db, 'users', userId, COLLECTION, mealId);
};

const fromFirestore = (id: string, data: Record<string, any>): MealCarbEstimate => ({
  id,
  confidence: data.confidence ?? 'low',
  created_at: data.created_at instanceof Timestamp
    ? data.created_at.toDate()
    : new Date(data.created_at),
  estimated_carbs_grams: data.estimated_carbs_grams ?? 0,
  foods_detected: data.foods_detected ?? [],
  image_bucket: data.image_bucket ?? '',
  image_gs_uri: data.image_gs_uri ?? '',
  image_path: data.image_path ?? '',
  notes: data.notes ?? '',
  raw_gemini_response: data.raw_gemini_response ?? '',
  status: data.status ?? 'pending',
});

export const subscribeMeals = (
  onUpdate: (meals: MealCarbEstimate[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(getMealCollection(), orderBy('created_at', 'desc'));
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

export const subscribeMeal = (
  mealId: string,
  onUpdate: (meal: MealCarbEstimate | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  return onSnapshot(
    getMealDoc(mealId),
    (snapshot) => {
      if (snapshot.exists()) {
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

export const subscribeMealByImagePath = (
  imagePath: string,
  onUpdate: (meal: MealCarbEstimate | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(
    getMealCollection(),
    where('image_path', '==', imagePath),
    orderBy('created_at', 'desc'),
    limit(1)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        onUpdate(fromFirestore(docSnap.id, docSnap.data()));
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Firestore image path listener error:', error);
      onError?.(error);
    }
  );
};

export const createMealEntry = async (
  imagePath: string,
  imageBucket: string,
  imageGsUri: string,
): Promise<string> => {
  const docRef = await addDoc(getMealCollection(), {
    status: 'pending',
    image_path: imagePath,
    image_bucket: imageBucket,
    image_gs_uri: imageGsUri,
    estimated_carbs_grams: 0,
    confidence: 'low',
    foods_detected: [],
    notes: '',
    raw_gemini_response: '',
    created_at: serverTimestamp(),
  });
  return docRef.id;
};

export const updateCarbEstimate = async (
  mealId: string,
  carbs: number
): Promise<void> => {
  await updateDoc(getMealDoc(mealId), {
    estimated_carbs_grams: carbs,
  });
};

export const deleteMealEntry = async (mealId: string): Promise<void> => {
  await deleteDoc(getMealDoc(mealId));
};