import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SplashAgoraAnimated from '../src/components/SplashAgoraAnimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Cormorant_600SemiBold, Cormorant_600SemiBold_Italic, Cormorant_700Bold } from '@expo-google-fonts/cormorant';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../src/store/useStore';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { colors } from '../src/theme';
import '../src/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initializeDevice, loadSettings } = useStore();
  const { hasSeenOnboarding, loading: onboardingLoading } = useOnboarding();
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Cormorant_600SemiBold,
    Cormorant_600SemiBold_Italic,
    Cormorant_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    (async () => {
      await initializeDevice();
      await loadSettings();
      setAppReady(true);
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded && appReady && !onboardingLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady, onboardingLoading]);

  if (!fontsLoaded || !appReady || onboardingLoading) {
    return <SplashAgoraAnimated />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.bg} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
        initialRouteName={hasSeenOnboarding ? '(tabs)' : 'onboarding'}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
        <Stack.Screen name="crisis" options={{ presentation: 'modal' }} />
        <Stack.Screen name="diary/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="conversations/index" />
        <Stack.Screen name="cycle/index" />
        <Stack.Screen name="monthly-record/index" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
