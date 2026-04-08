import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import SplashAgoraAnimated from '../src/components/SplashAgoraAnimated';
import { useUserStore } from '../src/store/useStore';

export default function RootLayout() {
  const already = typeof window !== 'undefined' && sessionStorage.getItem('agora_ready') === '1';
  const [appIsReady, setAppIsReady] = useState(already);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (already) return;
    const t = setTimeout(() => {
      if (typeof window !== 'undefined') sessionStorage.setItem('agora_ready', '1');
      setAppIsReady(true);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  const userToken = useUserStore((state) => state.userToken);

  useEffect(() => {
    if (!appIsReady) return;

    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';
    const inLanding = segments.length === 0 || segments[0] === 'index';

    if (!userToken && inTabs) {
      router.replace('/');
    } else if (!userToken && inAuth) {
      // flujo normal de login, no tocar
    } else if (!userToken && !inLanding && !inAuth) {
      router.replace('/');
    } else if (userToken && inAuth) {
      router.replace('/(tabs)/home');
    } else if (userToken && inLanding) {
      router.replace('/(tabs)/home');
    }
  }, [appIsReady, userToken, segments]);

  if (!appIsReady) return <SplashAgoraAnimated />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="cycle/index" options={{ headerShown: false }} />
    </Stack>
  );
}