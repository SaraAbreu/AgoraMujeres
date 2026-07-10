import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadSession = useUserStore((state) => state.loadSession);
  const token       = useUserStore((state) => state.token);
  const [appIsReady, setAppIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        await loadSession();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!appIsReady) return;

    // Detectar PWA instalada en modo standalone.
    // display-mode:standalone a veces no se reporta bien justo en el primer
    // lanzamiento tras una instalación nueva (visto en vivo: tras desinstalar
    // y reinstalar, la primera apertura mostraba la landing en vez de saltar
    // a bienvenida). Como respaldo, manifest.json ahora tiene
    // start_url: "/?pwa=1" — el sistema operativo siempre añade ese parámetro
    // al abrir la app desde su icono, así que comprobarlo es más fiable que
    // depender solo de la media query.
    const isStandalonePWA =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        new URLSearchParams(window.location.search).get('pwa') === '1');

    if (Platform.OS === 'web' && !isStandalonePWA) {
      // Navegador web normal: la landing (index.tsx) es la ruta raíz.
      // Solo redirigimos si ya hay sesión activa.
      if (token) router.replace('/(tabs)/home');
    } else {
      // Móvil nativo O PWA instalada: nunca mostrar la landing de marketing.
      if (token) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/bienvenida');
      }
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index"      />
      <Stack.Screen name="bienvenida" />
      <Stack.Screen name="login"      />
      <Stack.Screen name="(tabs)"     />
    </Stack>
  );
}
