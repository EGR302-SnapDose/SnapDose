import { getAuth, signOut } from "firebase/auth";
import { router } from "expo-router";

export async function logout() {
  const auth = getAuth();
  await signOut(auth);
  router.replace("/auth/login");
}
