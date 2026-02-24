import { auth } from "@/config/firebase";
import { router } from "expo-router";
import { signOut } from "firebase/auth";

export async function logout() {
  await signOut(auth);
  router.replace("/auth/login");
}
