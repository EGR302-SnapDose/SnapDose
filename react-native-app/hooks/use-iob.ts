import { useEffect, useState } from 'react';
import { auth, db } from '@/config/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

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
        const dosesCollection = collection(db, 'users', user.uid, 'doses');
        const snapshot = await getDocs(dosesCollection);
        const now = Date.now();
        let totalIOB = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const units = data.amount as number;
          let timestamp = data.timestamp;

          if (timestamp instanceof Timestamp) {
            timestamp = timestamp.toMillis();
          } else if (timestamp instanceof Date) {
            timestamp = timestamp.getTime();
          } else {
            return;
          }

          const minutesElapsed = (now - timestamp) / 60000;

          if (minutesElapsed >= 0 && minutesElapsed < 240) {
            const remainingInsulin = units * Math.exp(-minutesElapsed / 90);
            totalIOB += remainingInsulin;
          }
        });

        const roundedIOB = Math.max(0, Math.round(totalIOB * 100) / 100);
        setIOB(roundedIOB);
      } catch (error) {
        console.error('Failed to calculate IOB:', error);
        setIOB(0);
      }
    };

    _refreshIOB = calculateIOB;

    // Initial calculation
    calculateIOB();

    const intervalId = setInterval(() => {
      calculateIOB();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return iob;
}

export function refreshIOB() {
  if (_refreshIOB) {
    _refreshIOB();
  }
}
