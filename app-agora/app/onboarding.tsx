import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useUserStore } from '../store/userStore';

const isWeb = Platform.OS === 'web';

export default function Bienvenida() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setOnboardingDone = useUserStore((s) => s.setOnboardingDone);
  const { intent } = useLocalSearchParams<{ intent?: string }>();

  const narrow = width < 480;
  const pad = narrow ? 28 : 48;

  const handleContinue = async (mode: 'new' | 'existing') => {
    await setOnboardingDone(true);
    const params: Record<string, string> = { mode };
    if (intent) params.intent = intent;
    router.replace({ pathname: '/login', params });
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']}
        style={StyleSheet.absoluteFill}
      />

      {/* Marca de agua */}
      <Animated.Image
        entering={FadeIn.duration(1200)}
        source={require('../assets/images/logo2.png')}
        style={s.bgLogo}
        resizeMode="contain"
      />

      <View style={[s.content, { paddingHorizontal: pad }]}>

        {/* Branding */}
        <Animated.View entering={FadeIn.delay(200).duration(800)} style={s.header}>
          <Text style={s.brandingTech}>SYNTEXIA Solutions</Text>
        </Animated.View>

        {/* Orbe + título */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={s.hero}>
          <View style={s.orbe}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(251,248,244,0.8)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={s.orbeSymbol}>🌿</Text>
          </View>

          <Text style={s.titleAgora}>ÁGORA</Text>
          <Text style={s.titleMujeres}>mujeres</Text>

          <View style={s.dividerLine} />

          <Text style={s.copy}>
            Tu santuario está listo.{'\n'}
            Un espacio solo para ti, donde{'\n'}escucharte es el primer paso.
          </Text>
        </Animated.View>

        {/* CTAs */}
        <Animated.View
          entering={SlideInUp.delay(700).duration(600)}
          style={s.footer}
        >
          <TouchableOpacity
            style={s.btnPrimary}
            onPress={() => handleContinue('new')}
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={['#A07040', '#8B5A2B']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={s.btnPrimaryText}>CREAR MI CUENTA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnGhost}
            onPress={() => handleContinue('existing')}
            activeOpacity={0.75}
          >
            <Text style={s.btnGhostText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  bgLogo: {
    position: 'absolute',
    width: 340,
    height: 340,
    alignSelf: 'center',
    top: '15%',
    opacity: 0.05,
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 44,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },

  // Branding
  header: { alignItems: 'center' },
  brandingTech: {
    fontSize: 10,
    letterSpacing: 6,
    color: '#8B5A2B',
    fontWeight: 'bold',
    opacity: 0.5,
  },

  // Hero
  hero: { alignItems: 'center', paddingTop: 8 },

  orbe: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(197,160,89,0.3)',
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#C5A059',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  orbeSymbol: { fontSize: 30 },

  titleAgora: {
    fontSize: 52,
    fontWeight: '100',
    letterSpacing: 12,
    color: '#C5A059',
    textAlign: 'center',
    lineHeight: 56,
  },
  titleMujeres: {
    fontSize: 28,
    fontWeight: '100',
    letterSpacing: 4,
    color: '#8B5A2B',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: isWeb ? 'Georgia, serif' : 'System',
    marginTop: -4,
    marginBottom: 24,
  },

  dividerLine: {
    width: 28,
    height: 1,
    backgroundColor: '#C5A059',
    opacity: 0.45,
    marginBottom: 20,
  },

  copy: {
    fontSize: 15,
    fontWeight: '200',
    color: '#8B5A2B',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },

  // Footer
  footer: { gap: 12 },

  btnPrimary: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5A2B',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 2.5,
  },

  btnGhost: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(139,90,43,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  btnGhostText: {
    color: '#8B5A2B',
    fontWeight: '500',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
