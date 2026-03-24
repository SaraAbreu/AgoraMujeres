import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const ONBOARDING_SHOWN_KEY = 'agora_onboarding_shown';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        let shown: string | null = null;

        // 🌐 WEB → usar localStorage (NO AsyncStorage)
        if (typeof window !== 'undefined') {
          shown = localStorage.getItem(ONBOARDING_SHOWN_KEY);
        } 
        // 📱 NATIVE → usar AsyncStorage
        else {
          shown = await AsyncStorage.getItem(ONBOARDING_SHOWN_KEY);
        }

        setHasSeenOnboarding(shown === 'true');
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setHasSeenOnboarding(false);
      } finally {
        setLoading(false); // 🔥 ESTO ES CLAVE
      }
    };

    init();
  }, []);

  const markOnboardingAsShown = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
      } else {
        await AsyncStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
      }
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error marking onboarding as shown:', error);
    }
  };

  return {
    hasSeenOnboarding,
    loading,
    markOnboardingAsShown,
  };
}