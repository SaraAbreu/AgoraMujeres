import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import SplashAgoraAnimated from '../src/components/SplashAgoraAnimated';
import { useUserStore } from '../src/store/useStore';

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // ── 1. Splash 3 segundos ──────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setAppIsReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // ── 2. Routing tras el splash ─────────────────────────────
  useEffect(() => {
    if (!appIsReady) return;

    // Pequeño delay para que Zustand-persist hidrate desde localStorage.
    // En web, el store arranca con null y se rellena unos ms después.
    const t = setTimeout(() => {
      const inAuth = segments[0] === '(auth)';
      const inTabs = segments[0] === '(tabs)';
      if (inAuth || inTabs) return;

      // getState() es síncrono — siempre tiene el valor actual,
      // no el de la closure inicial del efecto.
      const token = useUserStore.getState().userToken;

      if (token) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }, 200);

    return () => clearTimeout(t);
  }, [appIsReady]);

  if (!appIsReady) return <SplashAgoraAnimated />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}