// services/logout-service.ts
import { getAuth, signOut } from 'firebase/auth';
import { router } from 'expo-router';

export async function logout() {
  try {
    const auth = getAuth();
    await signOut(auth);
    router.replace('/'); // change this to your login route if different
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}