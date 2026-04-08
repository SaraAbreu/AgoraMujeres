import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import SplashAgoraAnimated from '../src/components/SplashAgoraAnimated';
import { useUserStore } from '../src/store/useStore';
import { auth, googleProvider } from '../src/services/firebase';
import { getRedirectResult } from 'firebase/auth';

export default function RootLayout() {
  const already = typeof window !== 'undefined' && sessionStorage.getItem('agora_ready') === '1';
  const [appIsReady, setAppIsReady] = useState(already);
  const { setToken, setUserData, setDeviceId } = useUserStore();

  // Capturar resultado de Google redirect (móvil)
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      try {
        const user = result.user;
        const firebaseToken = await user.getIdToken();
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/auth/social-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: firebaseToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error('Error autenticando con backend');
        setToken(data.access_token);
        setDeviceId(data.user.uid);
        setUserData({ name: user.displayName, email: user.email, photo: user.photoURL });
      } catch (err) {
        console.error('Error getRedirectResult en layout:', err);
      }
    }).catch(() => {});
  }, []);
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