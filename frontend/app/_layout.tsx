import { useTrialCheck } from '../src/hooks/useTrialCheck';
import React, { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  View, ActivityIndicator, StyleSheet, Text,
  Animated, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { useFonts } from 'expo-font';
import {
  Cormorant_400Regular,
  Cormorant_500Medium,
  Cormorant_600SemiBold,
  Cormorant_700Bold,
} from '@expo-google-fonts/cormorant';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { Image } from 'expo-image';
import i18n from '../src/i18n';
import { useStore } from '../src/store/useStore';
import { colors } from '../src/theme/colors';
import { getSubscriptionStatus } from '../src/services/api';
import { registerNotificationService } from '../src/services/notificationService';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { OnboardingScreen } from '../src/components/OnboardingScreen';

const LOGO_URL = require('../assets/images/agora-logo.png');
const IS_WEB   = Platform.OS === 'web';

export default function RootLayout() {
  const [isReady,    setIsReady]    = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { initializeDevice, setSubscriptionStatus, language } = useStore();
  const { hasSeenOnboarding, loading: onboardingLoading, markOnboardingAsShown } = useOnboarding();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [fontsLoaded] = useFonts({
    Cormorant_400Regular,
    Cormorant_500Medium,
    Cormorant_600SemiBold,
    Cormorant_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const deviceId = await initializeDevice();

        try {
          const status = await getSubscriptionStatus(deviceId);
          setSubscriptionStatus(status);
        } catch (error) {
          // Backend no disponible — continuar con estado por defecto
          console.log('Subscription status unavailable:', error);
        }

        i18n.changeLanguage(language);
        setIsReady(true);

        if (IS_WEB) {
          try {
            await registerNotificationService();
          } catch {
            // Notificaciones opcionales
          }
        }

        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();

        setTimeout(() => setShowSplash(false), 2500);

      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true);
        setShowSplash(false);
      }
    };

    if (fontsLoaded) init();
  }, [fontsLoaded]);

  const { isTrialExpired } = useTrialCheck();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!fontsLoaded || onboardingLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.warmBrown} />
      </View>
    );
  }

  // ── Splash ─────────────────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" />
        <Animated.View
          style={[styles.splashContent, {
            opacity:   fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}
        >
          <Image source={LOGO_URL} style={styles.logo} contentFit="contain" />
        </Animated.View>
      </View>
    );
  }

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (!hasSeenOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={markOnboardingAsShown} />
      </SafeAreaProvider>
    );
  }

  // ── App principal ──────────────────────────────────────────────────────────
  const AppContent = (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <StatusBar style="light" />

        {isTrialExpired ? (
          // Pantalla de trial expirado
          <View style={styles.expiredContainer}>
            <View style={styles.expiredCard}>
              <Text style={styles.expiredTitle}>{i18n.t('trialExpired')}</Text>
              <Text style={styles.expiredSub}>{i18n.t('continueUsing')}</Text>
              <TouchableOpacity style={styles.expiredBtn} onPress={() => {}}>
                <Text style={styles.expiredBtnText}>{i18n.t('subscribe')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Stack
            screenOptions={{
              headerShown:  false,
              animation:    'fade',
              contentStyle: {
                backgroundColor: colors.background,
                // En web el ancho lo controla el PhoneFrame, no el Stack
                maxWidth:  IS_WEB ? '100%' : '100%',
                alignSelf: 'center',
                width:     '100%',
              },
            }}
          >
            <Stack.Screen name="(tabs)"               options={{ headerShown: false }} />
            <Stack.Screen name="crisis"               options={{ headerShown: false }} />
            <Stack.Screen name="diary/new"            options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="subscription"         options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="conversations/index"  options={{ headerShown: false }} />
            <Stack.Screen name="cycle/index"          options={{ headerShown: false }} />
            <Stack.Screen name="monthly-record/index" options={{ headerShown: false }} />
            <Stack.Screen name="resources/index"      options={{ headerShown: false }} />
          </Stack>
        )}
      </I18nextProvider>
    </SafeAreaProvider>
  );

  // ── Web: Sin mockup de iPhone, full-width ─────────────────────────────────
  if (IS_WEB) {
    return (
      <View style={webStyles.page}>
        <View style={webStyles.screen}>
          {AppContent}
        </View>
      </View>
    );
  }

  // ── Nativo: sin wrapper ────────────────────────────────────────────────────
  return AppContent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loading: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: colors.background,
  },
  splashContainer: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: '#D4C8BE',
  },
  splashContent: {
    alignItems: 'center',
  },
  logo: {
    width:      420,
    height:     420,
    resizeMode: 'contain',
  } as any,
  expiredContainer: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: colors.background,
  },
  expiredCard: {
    backgroundColor: colors.surface,
    padding:         32,
    borderRadius:    24,
    alignItems:      'center',
    shadowColor:     colors.shadowDark,
    shadowOpacity:   0.2,
    shadowRadius:    12,
    maxWidth:        340,
  },
  expiredTitle: {
    fontSize:     22,
    fontFamily:   'Cormorant_700Bold',
    color:        colors.error,
    marginBottom: 12,
  },
  expiredSub: {
    fontSize:     16,
    fontFamily:   'Nunito_400Regular',
    color:        colors.textSecondary,
    marginBottom: 24,
    textAlign:    'center',
  },
  expiredBtn: {
    backgroundColor:  colors.mossGreen,
    paddingVertical:  12,
    paddingHorizontal: 32,
    borderRadius:     12,
  },
  expiredBtnText: {
    color:      colors.softWhite,
    fontSize:   18,
    fontFamily: 'Nunito_600SemiBold',
  },
});

// Solo se aplican en web — full-width sin mockup de iPhone
const webStyles = StyleSheet.create({
  page: {
    flex:            1,
    alignItems:      'stretch',
    backgroundColor: '#F5F0E8',
    minHeight:       '100vh' as any,
    width:           '100%' as any,
  },
  frame: {
    display: 'none' as any,
  },
  notch:  {
    display: 'none' as any,
  },
  screen: {
    flex:            1,
    width:           '100%' as any,
    backgroundColor: colors.background,
  },
});
