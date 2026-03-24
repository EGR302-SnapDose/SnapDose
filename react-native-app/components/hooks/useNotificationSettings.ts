import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export function useNotificationSettings(userId: string | undefined) {
  const [settings, setSettings] = useState({
    highGlucoseAlert: true,
    lowGlucoseAlert: true,
    mealReminders: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, "users", userId, "settings", "notifications");
    getDoc(ref).then((snap) => {
      if (snap.exists()) setSettings(snap.data() as typeof settings);
      setLoading(false);
    });
  }, [userId]);

  const toggleSetting = async (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    const ref = doc(db, "users", userId!, "settings", "notifications");
    await setDoc(ref, updated, { merge: true });
  };

  return { settings, toggleSetting, loading };
}