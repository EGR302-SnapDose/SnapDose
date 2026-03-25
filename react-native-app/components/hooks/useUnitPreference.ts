import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export type GlucoseUnit = "mg/dL" | "mmol/L";

export function useUnitPreference(userId: string | undefined) {
  const [unit, setUnit] = useState<GlucoseUnit>("mg/dL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, "users", userId, "settings", "preferences");
    getDoc(ref).then((snap) => {
      if (snap.exists() && snap.data().glucoseUnit) {
        setUnit(snap.data().glucoseUnit);
      }
      setLoading(false);
    });
  }, [userId]);

  const toggleUnit = async () => {
    const newUnit: GlucoseUnit = unit === "mg/dL" ? "mmol/L" : "mg/dL";
    setUnit(newUnit);
    const ref = doc(db, "users", userId!, "settings", "preferences");
    await setDoc(ref, { glucoseUnit: newUnit }, { merge: true });
  };

  return { unit, toggleUnit, loading };
}