import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'agora_onboarding_shown';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const shown =
          typeof window !== 'undefined'
            ? localStorage.getItem(KEY)
            : await AsyncStorage.getItem(KEY);
        setHasSeenOnboarding(shown === 'true');
      } catch {
        setHasSeenOnboarding(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markOnboardingAsShown = async () => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(KEY, 'true');
      else await AsyncStorage.setItem(KEY, 'true');
      setHasSeenOnboarding(true);
    } catch { /* noop */ }
  };

  return { hasSeenOnboarding, loading, markOnboardingAsShown };
}
