import { auth, db } from "@/config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

let _refreshIOB: (() => void) | null = null;

export function useIOB(): number {
  const [iob, setIOB] = useState(0);

  useEffect(() => {
    const calculateIOB = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIOB(0);
        return;
      }

      try {
        const bolusesRef = collection(db, "users", user.uid, "boluses");
        const q = query(bolusesRef, where("status", "==", "COMPLETED"));
        const snapshot = await getDocs(q);
        const now = Date.now();
        let totalIOB = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const units = (data.unitsDelivered ?? data.unitsRequested) as number;
          const createdAt = data.createdAt as number;

          if (!units || !createdAt) return;

          const minutesElapsed = (now - createdAt) / 60000;

          if (minutesElapsed >= 0 && minutesElapsed < 240) {
            const remainingInsulin = units * Math.exp(-minutesElapsed / 90);
            totalIOB += remainingInsulin;
          }
        });

        const roundedIOB = Math.max(0, Math.round(totalIOB * 100) / 100);
        setIOB(roundedIOB);
      } catch (error) {
        console.error("Failed to calculate IOB:", error);
        setIOB(0);
      }
    };

    _refreshIOB = calculateIOB;
    calculateIOB();

    const intervalId = setInterval(calculateIOB, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return iob;
}

export function refreshIOB() {
  if (_refreshIOB) {
    _refreshIOB();
  }
}
