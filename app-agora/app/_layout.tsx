import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function guard() {
      try {
        // 1. Obtener Token
        let token;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('userToken');
        } else {
          token = await SecureStore.getItemAsync('userToken');
        }

        const hasToken = !!token;
        const currentSeg = segments[0] as string | undefined;

        // 2. Definir rutas. Si no hay segmento, es la raíz (Landing Web)
        const isLanding = !currentSeg || currentSeg === 'index';
        const isAuth = currentSeg === 'login' || currentSeg === 'onboarding';

        // 3. Lógica de redirección estricta
        if (!hasToken && !isLanding && !isAuth) {
          // Si intenta entrar a tabs sin token, lo echamos a la Landing
          router.replace('/');
        } else if (hasToken && isLanding) {
          // Si ya tiene sesión, que vaya al flujo de la app
          router.replace('/onboarding');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    guard();
  }, [segments]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> 
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}