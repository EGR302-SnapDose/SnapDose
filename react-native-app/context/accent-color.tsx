/**
 * AccentColorContext — Provides user's selected accent color app-wide
 *
 * Usage:
 *   const accentColor = useAccentColor();
 *   <View style={{ backgroundColor: accentColor }} />
 *
 * Falls back to colors.primary when no user is logged in or no color is set.
 */

import { auth, db } from '@/config/firebase';
import { colors } from '@/constants/theme';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_ACCENT = colors.primary; // Blue fallback

const AccentColorContext = createContext<string>(DEFAULT_ACCENT);

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColor] = useState<string>(DEFAULT_ACCENT);

  useEffect(() => {
    // Listen for auth state changes
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // No user logged in — reset to default
        setAccentColor(DEFAULT_ACCENT);
        return;
      }

      // Listen for user document changes (real-time updates)
      const userDocRef = doc(db, 'users', user.uid);
      const unsubDoc = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setAccentColor(data.accentColor ?? DEFAULT_ACCENT);
          } else {
            setAccentColor(DEFAULT_ACCENT);
          }
        },
        (error) => {
          console.warn('AccentColorContext: Failed to load accent color', error);
          setAccentColor(DEFAULT_ACCENT);
        }
      );

      // Return cleanup for document listener
      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, []);

  return (
    <AccentColorContext.Provider value={accentColor}>
      {children}
    </AccentColorContext.Provider>
  );
}

/**
 * Hook to get the current user's accent color.
 * Returns the default primary color if no user is logged in.
 */
export function useAccentColor(): string {
  return useContext(AccentColorContext);
}
