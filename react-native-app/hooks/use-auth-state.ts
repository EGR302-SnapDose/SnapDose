import { auth } from '@/config/firebase'; // adjust path to your firebase init file
import { checkOnboardingStatus } from '@/services/user-service';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
 
type AuthStatus =
    | 'loading'
    | 'unauthenticated'
    | 'needs-onboarding'
    | 'authenticated';
 
export function useAuthState() {
    const [status, setStatus] = useState<AuthStatus>('loading');
 
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setStatus('unauthenticated');
                return;
            }
 
            try {
                const hasCompletedOnboarding = await checkOnboardingStatus();
                setStatus(hasCompletedOnboarding ? 'authenticated' : 'needs-onboarding');
            } catch {
                // If we can't determine onboarding status, send to onboarding to be safe
                setStatus('needs-onboarding');
            }
        });
 
        return unsubscribe;
    }, []);
 
    return status;
}