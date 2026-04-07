import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";

const API_BASE =
  "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";

export interface GlucoseReading {
  value: number;
  trend: string;
  systemTime: string;
}

/**
 * Hook to fetch and provide the current glucose reading from Dexcom
 * Automatically refreshes every 5 minutes
 */
export function useGlucose(): number | null {
  const [glucoseValue, setGlucoseValue] = useState<number | null>(null);

  useEffect(() => {
    const fetchGlucose = async () => {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        return;
      }

      try {
        const [realtimeRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/realtime?minutes=10&maxCount=1`),
          fetch(`${API_BASE}/latest?userId=${userId}`),
        ]);

        const historyData = historyRes.ok
          ? await historyRes.json().catch(() => null)
          : null;

        if (realtimeRes.ok) {
          const realtimeData = await realtimeRes.json();
          if (realtimeData.latest?.value) {
            setGlucoseValue(realtimeData.latest.value);
          }
        } else if (historyData?.latest?.value) {
          setGlucoseValue(historyData.latest.value);
        }
      } catch (err) {
        console.error("Glucose fetch error in useGlucose:", err);
      }
    };

    fetchGlucose();
    const interval = setInterval(fetchGlucose, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return glucoseValue;
}
