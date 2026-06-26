import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withRepeat, withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const LOGO_W = Math.min(width * 0.72, 340);
const LOGO_H = LOGO_W * 1.24; // proporción 928×1152
const LOGO   = require('../assets/images/logo.png');

export default function BienvenidaScreen() {
  const router = useRouter();

  // ── Animaciones ────────────────────────────────────────────────────────────
  const logoOp     = useSharedValue(0);
  const logoScale  = useSharedValue(1.12);
  const blurAmt    = useSharedValue(Platform.OS === 'web' ? 18 : 0);

  // Shimmer que barre el logo una sola vez
  const shimmerX   = useSharedValue(-LOGO_W);

  // Glow ambiental (muy difuso, sin forma visible)
  const ambientOp  = useSharedValue(0);

  // Tagline y botón
  const taglineOp  = useSharedValue(0);
  const taglineY   = useSharedValue(16);
  const btnOp      = useSharedValue(0);
  const btnY       = useSharedValue(18);

  useEffect(() => {
    // — Glow ambiental aparece muy suave
    ambientOp.value = withTiming(1, { duration: 1600 });

    // — Logo: fade + escala
    logoOp.value    = withDelay(200, withTiming(1, { duration: 1000 }));
    logoScale.value = withDelay(200, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));

    // — Blur → nítido (web)
    if (Platform.OS === 'web') {
      blurAmt.value = withDelay(200, withTiming(0, { duration: 1300, easing: Easing.out(Easing.cubic) }));
    }

    // — Shimmer una sola vez, después de que el logo esté visible
    shimmerX.value = withDelay(1300, withTiming(LOGO_W * 1.6, { duration: 850, easing: Easing.inOut(Easing.quad) }));

    // — Tagline
    taglineOp.value = withDelay(1500, withTiming(1, { duration: 800 }));
    taglineY.value  = withDelay(1500, withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }));

    // — Botón
    btnOp.value = withDelay(2200, withTiming(1, { duration: 700 }));
    btnY.value  = withDelay(2200, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, []);

  // ── Estilos animados ───────────────────────────────────────────────────────
  const ambientStyle = useAnimatedStyle(() => ({ opacity: ambientOp.value }));

  const logoStyle = useAnimatedStyle(() => {
    const base: any = {
      opacity:   logoOp.value,
      transform: [{ scale: logoScale.value }],
    };
    if (Platform.OS === 'web') {
      base.filter = `blur(${blurAmt.value}px)`;
    }
    return base;
  });

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity:   taglineOp.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity:   btnOp.value,
    transform: [{ translateY: btnY.value }],
  }));

  return (
    <View style={s.container}>

      {/* ── Fondo: oscuro con mancha cálida sutil en el centro ── */}
      <LinearGradient
        colors={['#08080C', '#111018', '#0E0C10']}
        style={StyleSheet.absoluteFill}
      />

      {/* Viñeta inversa: punto de luz muy suave detrás del logo */}
      <Animated.View style={[s.ambient, ambientStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(190,175,210,0.09)', 'rgba(160,140,185,0.04)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.32 }}
          end={{ x: 0.5, y: 0.85 }}
        />
      </Animated.View>

      {/* ── Centro ── */}
      <View style={s.center}>

        {/* Logo con shimmer */}
        <Animated.View style={[s.logoWrap, logoStyle]}>
          <Image source={LOGO} style={s.logoImg} resizeMode="contain" />

          {/* Shimmer: barre diagonal una vez */}
          <View style={s.shimmerClip} pointerEvents="none">
            <Animated.View style={[s.shimmerStrip, shimmerStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.shimmerGrad}
              />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[s.taglineBlock, taglineStyle]}>
          <Text style={s.tagline}>El santuario digital</Text>
          <Text style={s.taglineLight}>para tu salud y bienestar</Text>
        </Animated.View>

      </View>

      {/* ── Botón outline ── */}
      <Animated.View style={[s.btnWrap, btnStyle]}>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/login')} activeOpacity={0.7}>
          <View style={s.btnInner}>
            <Text style={s.btnText}>ENTRAR AL SANTUARIO</Text>
            <Ionicons name="arrow-forward" size={14} color="rgba(200,190,215,0.8)" />
          </View>
        </TouchableOpacity>
        <Text style={s.btnHint}>Tu espacio seguro te espera</Text>
      </Animated.View>

      {/* Branding */}
      <Text style={s.brand}>Syntexia Solutions</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Glow ambiental — ocupa toda la pantalla, sin forma
  ambient: { ...StyleSheet.absoluteFillObject },

  // Centro
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },

  // Logo
  logoWrap: {
    width: LOGO_W,
    height: LOGO_H,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // necesario para que el shimmer no salga
  },
  logoImg: {
    width: LOGO_W,
    height: LOGO_H,
    position: 'absolute',
  },

  // Shimmer
  shimmerClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: LOGO_W * 0.45,
    left: 0,
  },
  shimmerGrad: {
    flex: 1,
    transform: [{ skewX: '-15deg' }],
  },

  // Tagline
  taglineBlock: { alignItems: 'center', gap: 5 },
  tagline:      { fontSize: 16, fontWeight: '200', color: 'rgba(215,210,225,0.8)', letterSpacing: 1.5 },
  taglineLight: { fontSize: 12, fontWeight: '300', color: 'rgba(180,175,195,0.4)', letterSpacing: 0.5 },

  // Botón outline
  btnWrap: {
    paddingBottom: 60,
    alignItems: 'center',
    gap: 14,
    width: '100%',
    paddingHorizontal: 40,
  },
  btn: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(190,180,210,0.35)',
    overflow: 'hidden',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  btnText: {
    color: 'rgba(200,190,215,0.85)',
    fontWeight: '400',
    fontSize: 11,
    letterSpacing: 3,
  },
  btnHint: { fontSize: 10, color: 'rgba(180,175,195,0.25)', letterSpacing: 0.5 },

  brand: {
    position: 'absolute',
    bottom: 20,
    fontSize: 9,
    color: 'rgba(255,255,255,0.1)',
    letterSpacing: 2,
    fontWeight: '300',
  },
});
