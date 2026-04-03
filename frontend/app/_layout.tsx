import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import SplashAgoraAnimated from '../src/components/SplashAgoraAnimated';

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // ── 1. SPLASH 3 segundos ─────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setAppIsReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // ── 2. CONTROL DE FLUJO ──────────────────────────────────
  // En web, expo-router SIEMPRE tiene segmentos (nunca length === 0).
  // Detectamos "sin ruta válida" comprobando que no está en (auth) ni (tabs).
  useEffect(() => {
    if (!appIsReady) return;

    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    if (!inAuth && !inTabs) {
      router.replace('/(auth)/onboarding');
    }
  }, [appIsReady]); // Solo depende de appIsReady para evitar loops

  if (!appIsReady) return <SplashAgoraAnimated />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
