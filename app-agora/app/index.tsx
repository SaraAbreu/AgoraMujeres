import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Linking, Platform, useWindowDimensions, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeInDown,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';

// ── Constantes estáticas (no dependen del tamaño de ventana) ────────────────
const isWeb = Platform.OS === 'web';

// ── Estilos responsivos como función ────────────────────────────────────────
// Se llama dentro del componente con los valores calculados del hook.
function getStyles(D: boolean, pad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDFCFB' },
    bgLogo: {
      position: 'absolute',
      width: D ? 700 : 320,
      height: D ? 700 : 320,
      alignSelf: 'center',
      top: D ? 60 : 40,
      opacity: 0.055,
    },
    scroll: { paddingBottom: D ? 100 : 60 },

    // NAV
    navBar: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: pad,
      paddingVertical: D ? 40 : 20,
    },
    brandingTech: { letterSpacing: D ? 8 : 3, fontSize: 11, color: '#8B5A2B', fontWeight: 'bold' },
    navAction: { borderBottomWidth: 1, borderColor: '#8B5A2B', paddingBottom: 4 },
    navActionText: { fontSize: 10, fontWeight: 'bold', color: '#8B5A2B', letterSpacing: 2 },

    // HERO
    heroSection: {
      minHeight: D ? 340 : undefined,
      paddingVertical: D ? 80 : 60,
      justifyContent: 'center', alignItems: 'center',
    },
    titleAgora: {
      fontSize: D ? 140 : 64,
      fontWeight: '100',
      letterSpacing: D ? 40 : 8,
      color: '#C5A059',
      textAlign: 'center',
    },
    titleMujeres: {
      fontSize: D ? 80 : 38,
      fontWeight: '100',
      letterSpacing: D ? 12 : 4,
      color: '#8B5A2B',
      textAlign: 'center',
      marginTop: D ? -48 : 4,
      fontFamily: isWeb ? 'Georgia, serif' : 'System',
    },
    manifestoWrapper: { marginTop: D ? 36 : 28, alignItems: 'center', paddingHorizontal: 24 },
    manifestoLine: { width: 36, height: 1, backgroundColor: '#C5A059', marginBottom: D ? 18 : 14 },
    manifestoText: { textAlign: 'center', fontSize: D ? 22 : 16, color: '#8B5A2B', fontWeight: '200' },
    italic: { fontStyle: 'italic' },

    heroCTAWrapper: { marginTop: D ? 44 : 32, alignItems: 'center' },
    heroCTA: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: '#8B5A2B',
      paddingHorizontal: D ? 44 : 28, paddingVertical: D ? 18 : 14,
      borderRadius: 40,
      shadowColor: '#8B5A2B', shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
    },
    heroCTAText: { color: 'white', fontWeight: 'bold', letterSpacing: 2, fontSize: D ? 13 : 11 },

    // SHOWCASE
    showcaseSection: { marginTop: D ? 40 : 28, paddingHorizontal: pad, alignItems: 'center' },
    mockupContainer: {
      width: '100%',
      borderRadius: D ? 40 : 24,
      flexDirection: D ? 'row' : 'column',
      overflow: 'hidden',
      elevation: 12,
      shadowColor: '#8B5A2B', shadowOpacity: 0.12, shadowRadius: 24,
      borderWidth: 1, borderColor: 'rgba(197,160,89,0.2)',
    },

    // Columna izquierda del showcase
    showcaseLeft: {
      width: D ? undefined : '100%',
      flex: D ? 1 : undefined,
      padding: D ? 48 : 24,
      justifyContent: 'center',
    },
    showcaseTag: { fontSize: 10, letterSpacing: 4, color: '#C5A059', fontWeight: 'bold', marginBottom: D ? 14 : 10 },
    showcaseTitle: {
      fontSize: D ? 36 : 26,
      fontWeight: '200', color: '#8B5A2B',
      lineHeight: D ? 46 : 34,
      marginBottom: D ? 12 : 8,
    },
    showcaseSubtitle: {
      fontSize: D ? 15 : 13, color: '#8B5A2B', opacity: 0.6,
      lineHeight: D ? 24 : 20,
      marginBottom: D ? 28 : 18,
    },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: D ? 14 : 10, marginBottom: D ? 24 : 16 },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: D ? 20 : 16, fontWeight: 'bold', color: '#8B5A2B' },
    statLabel: { fontSize: D ? 10 : 8, color: '#8B5A2B', opacity: 0.55, textAlign: 'center' },
    statDivider: { width: 1, height: D ? 30 : 22, backgroundColor: 'rgba(197,160,89,0.3)' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: D ? 8 : 6, marginBottom: D ? 28 : 18 },
    chip: {
      backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20,
      paddingHorizontal: D ? 14 : 10, paddingVertical: D ? 7 : 5,
      borderWidth: 1, borderColor: 'rgba(197,160,89,0.3)',
    },
    chipText: { fontSize: D ? 12 : 10, color: '#8B5A2B' },
    downloadRow: { flexDirection: 'row', gap: D ? 14 : 10, flexWrap: 'wrap' },
    downloadBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: '#8B5A2B',
      paddingHorizontal: D ? 24 : 18, paddingVertical: D ? 14 : 12,
      borderRadius: 16,
      shadowColor: '#8B5A2B', shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
    },
    downloadBtnSmall: { fontSize: 9, color: 'rgba(255,255,255,0.65)', letterSpacing: 1 },
    downloadBtnBig: { fontSize: D ? 13 : 12, color: 'white', fontWeight: 'bold' },
    downloadBtnOutline: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderWidth: 1.5, borderColor: '#8B5A2B',
      paddingHorizontal: D ? 24 : 18, paddingVertical: D ? 14 : 12,
      borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.55)',
    },
    downloadBtnSmallDark: { fontSize: 9, color: 'rgba(139,90,43,0.55)', letterSpacing: 1 },
    downloadBtnBigDark: { fontSize: D ? 13 : 12, color: '#8B5A2B', fontWeight: 'bold' },

    // Columna derecha del showcase — teléfono
    showcaseRight: {
      width: D ? undefined : '100%',
      flex: D ? 1 : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: D ? 40 : 32,
      paddingHorizontal: D ? 40 : 24,
    },
    phoneFrame: {
      width: D ? 240 : 200,
      height: D ? 480 : 400,
      backgroundColor: '#1a1a1a',
      borderRadius: D ? 36 : 30,
      padding: D ? 9 : 7,
      shadowColor: '#8B5A2B', shadowOpacity: 0.18, shadowRadius: 24, elevation: 16,
      borderWidth: 2, borderColor: 'rgba(197,160,89,0.25)',
    },
    phoneNotch: {
      width: D ? 72 : 60, height: D ? 18 : 14,
      backgroundColor: '#1a1a1a',
      borderRadius: 10, alignSelf: 'center', marginBottom: 4,
    },
    phoneScreen: {
      flex: 1, backgroundColor: '#FDFCFB',
      borderRadius: D ? 28 : 24,
      overflow: 'hidden', padding: D ? 14 : 12,
      justifyContent: 'space-between',
    },
    appHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: D ? 10 : 8,
      borderBottomWidth: 1, borderColor: 'rgba(197,160,89,0.2)',
      marginBottom: D ? 10 : 8,
    },
    appHeaderText: { fontSize: D ? 13 : 11, fontWeight: 'bold', color: '#8B5A2B', letterSpacing: 2 },
    appHeaderDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C5A059' },
    bubbleAssistant: {
      backgroundColor: 'rgba(197,160,89,0.15)',
      borderRadius: D ? 14 : 12, borderBottomLeftRadius: 4,
      padding: D ? 10 : 8, alignSelf: 'flex-start',
      maxWidth: '85%', marginBottom: D ? 8 : 6,
    },
    bubbleAssistantText: { fontSize: D ? 11 : 10, color: '#8B5A2B', lineHeight: D ? 16 : 15 },
    bubbleUser: {
      backgroundColor: '#8B5A2B',
      borderRadius: D ? 14 : 12, borderBottomRightRadius: 4,
      padding: D ? 10 : 8, alignSelf: 'flex-end',
      maxWidth: '75%', marginBottom: D ? 8 : 6,
    },
    bubbleUserText: { fontSize: D ? 11 : 10, color: 'white', lineHeight: D ? 16 : 15 },
    phoneInput: {
      backgroundColor: 'rgba(139,90,43,0.07)',
      borderRadius: 20, padding: D ? 10 : 8,
    },
    phoneInputText: { fontSize: D ? 10 : 9, color: 'rgba(139,90,43,0.35)' },

    // Badge comunidad — debajo del teléfono en móvil, absoluto en desktop
    socialBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: 'white', borderRadius: 16,
      padding: D ? 14 : 11,
      marginTop: D ? 0 : 16,
      ...(D ? {
        position: 'absolute' as const,
        bottom: 24,
        left: 24,
      } : {}),
      shadowColor: '#8B5A2B', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
      alignSelf: D ? undefined : 'center',
    },
    socialBadgeEmoji: { fontSize: D ? 20 : 18 },
    socialBadgeTitle: { fontSize: D ? 12 : 11, fontWeight: 'bold', color: '#8B5A2B' },
    socialBadgeSub: { fontSize: D ? 10 : 9, color: '#8B5A2B', opacity: 0.6 },

    // SECCIONES
    sectionContainer: { paddingHorizontal: pad, marginTop: D ? 100 : 48 },
    sectionLabel: {
      fontSize: 10, letterSpacing: 5, color: '#C5A059', fontWeight: 'bold',
      textAlign: 'center', marginBottom: D ? 48 : 24,
    },

    // FEATURES
    featuresGrid: { gap: D ? 18 : 14, flexDirection: D ? 'row' : 'column' },
    featureCard: {
      flex: D ? 1 : undefined,
      padding: D ? 32 : 22,
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderRadius: D ? 28 : 18,
      borderWidth: 1, borderColor: 'rgba(197,160,89,0.18)',
    },
    featureIconWrap: {
      width: D ? 52 : 44, height: D ? 52 : 44,
      borderRadius: D ? 16 : 13,
      backgroundColor: 'rgba(197,160,89,0.1)',
      justifyContent: 'center', alignItems: 'center',
      marginBottom: D ? 14 : 10,
    },
    featureTitle: { fontSize: D ? 17 : 15, fontWeight: 'bold', color: '#8B5A2B', marginBottom: D ? 6 : 5 },
    featureText: { color: '#8B5A2B', opacity: 0.62, lineHeight: D ? 22 : 18, fontSize: D ? 14 : 12 },
    featureDivider: { width: '100%', height: 1, backgroundColor: 'rgba(197,160,89,0.18)', marginVertical: D ? 16 : 12 },
    featureBulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: D ? 8 : 6 },
    featureBulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#C5A059' },
    featureBulletText: { fontSize: D ? 13 : 11, color: '#8B5A2B', opacity: 0.72, flex: 1 },

    // ACCESO / PRICING
    actionSection: { paddingHorizontal: pad, marginTop: D ? 90 : 40 },
    glassCápsula: {
      borderRadius: D ? 48 : 24,
      backgroundColor: 'rgba(255,255,255,0.4)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)',
      overflow: 'hidden',
      flexDirection: D ? 'row' : 'column',
    },
    actionDoor: { flex: 1, padding: D ? 56 : 28, alignItems: 'center' },
    actionDoorPremium: { flex: 1, padding: D ? 56 : 28, alignItems: 'center' },
    divider: {
      width: D ? 1 : '80%',
      height: D ? undefined : 1,
      backgroundColor: 'rgba(139,90,43,0.1)',
      alignSelf: 'center',
    },
    cardLabel: { fontSize: 9, letterSpacing: 4, color: '#C5A059', marginBottom: D ? 18 : 10 },
    cardLabelGold: { fontSize: 9, letterSpacing: 4, color: '#8B5A2B', marginBottom: D ? 18 : 10 },
    cardMainTitle: { fontSize: D ? 30 : 26, fontWeight: '200', color: '#8B5A2B' },
    cardMainTitleGold: { fontSize: D ? 30 : 26, fontWeight: '200', color: '#8B5A2B' },
    cardDesc: { textAlign: 'center', color: '#8B5A2B', opacity: 0.6, marginTop: 8, fontSize: D ? 14 : 13 },
    cardDescGold: { textAlign: 'center', color: '#8B5A2B', opacity: 0.8, marginTop: 8, fontSize: D ? 14 : 13 },
    pricingFeatureList: { width: '100%', marginTop: D ? 22 : 16, marginBottom: D ? 26 : 18, gap: D ? 10 : 8 },
    pricingFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pricingFeatureText: { fontSize: D ? 13 : 12, color: '#8B5A2B', opacity: 0.75 },
    pricingFeatureTextGold: { fontSize: D ? 13 : 12, color: '#8B5A2B' },
    popularBadge: {
      backgroundColor: '#8B5A2B', borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 5,
      alignSelf: 'flex-start', marginBottom: D ? 14 : 10,
    },
    popularBadgeText: { fontSize: 9, color: 'white', fontWeight: 'bold', letterSpacing: 2 },
    esenciaBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 1.5, borderColor: '#C5A059',
      paddingHorizontal: D ? 22 : 18, paddingVertical: D ? 13 : 11,
      borderRadius: 30, alignSelf: 'flex-start',
    },
    esenciaBtnText: { color: '#8B5A2B', fontWeight: 'bold', fontSize: 10, letterSpacing: 2 },
    goldActionPill: {
      backgroundColor: '#8B5A2B',
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: D ? 28 : 22, paddingVertical: D ? 14 : 11,
      borderRadius: 30, alignSelf: 'flex-start',
    },
    goldPillText: { color: 'white', fontWeight: 'bold', fontSize: 10, letterSpacing: 2 },

    // CO-CREACIÓN / FEEDBACK
    feedbackWrapper: {
      backgroundColor: 'rgba(255,255,255,0.5)',
      borderRadius: D ? 36 : 22,
      padding: D ? 40 : 24,
      alignItems: 'center',
    },
    feedbackTitle: { fontSize: D ? 22 : 19, color: '#8B5A2B', fontWeight: '200', marginBottom: 8 },
    feedbackSubtitle: { textAlign: 'center', color: '#8B5A2B', opacity: 0.6, marginBottom: D ? 28 : 16, fontSize: D ? 14 : 13 },
    inputContainer: { width: '100%', maxWidth: 580 },
    textInput: {
      backgroundColor: 'white', borderRadius: 14, padding: 16,
      height: D ? 96 : 84,
      textAlignVertical: 'top', color: '#8B5A2B', fontSize: 14,
    },
    sendButton: {
      backgroundColor: '#8B5A2B', flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', alignSelf: 'center',
      paddingHorizontal: D ? 36 : 26, paddingVertical: D ? 14 : 13,
      borderRadius: 30, marginTop: D ? 18 : 12, gap: 8,
    },
    sendButtonText: { color: 'white', fontWeight: 'bold', fontSize: 11, letterSpacing: 2 },
    thanksContainer: { alignItems: 'center', padding: 20 },
    thanksText: { color: '#8B5A2B', fontWeight: '500', marginTop: 10, textAlign: 'center' },

    // FAQ
    faqContainer: { maxWidth: 780, alignSelf: 'center', width: '100%' },
    faqItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(139,90,43,0.1)', paddingVertical: D ? 22 : 17 },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { fontSize: D ? 15 : 14, color: '#8B5A2B', fontWeight: '500', flex: 1, paddingRight: 12 },
    faqAnswer: { marginTop: D ? 13 : 10, color: '#8B5A2B', opacity: 0.68, lineHeight: 22, fontSize: D ? 14 : 13 },

    // FINAL CTA
    finalCTA: {
      marginTop: D ? 90 : 44,
      marginHorizontal: pad,
      paddingVertical: D ? 90 : 52,
      borderRadius: D ? 48 : 28,
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    finalCTAGradient: { ...StyleSheet.absoluteFillObject },
    finalTitle: {
      fontSize: D ? 44 : 28,
      fontWeight: '100', color: '#8B5A2B',
      marginBottom: D ? 18 : 12,
      letterSpacing: 2, textAlign: 'center',
      paddingHorizontal: 16,
    },
    finalSubtitle: {
      fontSize: D ? 16 : 14, color: '#8B5A2B', opacity: 0.58,
      textAlign: 'center', marginBottom: D ? 36 : 22,
      maxWidth: 480, paddingHorizontal: 16,
    },
    mainButton: {
      backgroundColor: '#8B5A2B',
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: D ? 40 : 28, paddingVertical: D ? 18 : 14,
      borderRadius: 40, gap: 12,
      shadowColor: '#8B5A2B', shadowOpacity: 0.28, shadowRadius: 20, elevation: 8,
    },
    mainButtonText: { color: 'white', fontWeight: 'bold', letterSpacing: 2, fontSize: 12 },

    // FOOTER
    footer: { marginTop: D ? 56 : 32, paddingBottom: D ? 48 : 28, alignItems: 'center' },
    footerLinks: {
      flexDirection: 'row', gap: D ? 18 : 10,
      marginBottom: D ? 18 : 10,
      alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center',
    },
    fLink: { fontSize: 9, letterSpacing: 2, color: '#8B5A2B', fontWeight: 'bold' },
    fDot: { color: '#C5A059' },
    footerBrand: { letterSpacing: D ? 7 : 3, fontSize: 10, color: '#8B5A2B', opacity: 0.38, textAlign: 'center' },
  });
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const { width } = useWindowDimensions();
  const D = isWeb && width >= 768;
  const s = getStyles(D, D ? Math.min(100, width * 0.08) : 20);
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={s.faqItem} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
      <View style={s.faqHeader}>
        <Text style={s.faqQuestion}>{question}</Text>
        <Ionicons name={open ? 'remove' : 'add'} size={20} color="#8B5A2B" />
      </View>
      {open && <Animated.Text entering={FadeIn} style={s.faqAnswer}>{answer}</Animated.Text>}
    </TouchableOpacity>
  );
};

// ── Componente principal ────────────────────────────────────────────────────

export default function AgoraFinalLanding() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  // isDesktop se recalcula en cada render cuando cambia el tamaño de ventana
  const D = isWeb && width >= 768;
  const pad = D ? Math.min(100, width * 0.08) : 20;
  const s = getStyles(D, pad);

  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ── Instalación real de la PWA (Chrome/Edge) ──────────────────────────────
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;

    // ¿Ya está instalada/abierta como app? No mostramos nada de "instalar".
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const onBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // evita el mini-banner nativo, lo disparamos nosotras
      setInstallPromptEvent(e);
    };
    const onAppInstalled = () => setInstallPromptEvent(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      // El navegador aún no ofreció el evento (o ya está instalada, o el
      // navegador no soporta instalación — ej. Safari). Avisamos en vez
      // de no hacer nada.
      if (Platform.OS === 'web') {
        window.alert(
          'Para instalar: usa el ícono de instalación en la barra de direcciones, o el menú ⋮ > "Instalar Ágora Mujeres". En iPhone/Safari: Compartir > "Añadir a pantalla de inicio".'
        );
      }
      return;
    }
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };

  // Parallax del logo (solo desktop web)
  const mX = useSharedValue(0);
  const mY = useSharedValue(0);
  const onMove = (e: any) => {
    if (D) {
      mX.value = (e.clientX - width / 2) / 60;
      mY.value = (e.clientY - height / 2) / 60;
    }
  };
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(mX.value) }, { translateY: withSpring(mY.value) }],
  }));

  const handleSendFeedback = () => {
    if (feedback.length > 5) {
      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); setFeedback(''); }, 4000);
    }
  };

  return (
    <View style={s.container} onPointerMove={onMove}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />

      {/* Logo marca de agua con parallax */}
      <Animated.Image
        source={require('../assets/images/logo2.png')}
        style={[s.bgLogo, logoStyle]}
        resizeMode="contain"
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── NAV ─────────────────────────────────────────────────────────── */}
        <View style={s.navBar}>
          <Text style={s.brandingTech}>SYNTEXIA Solutions</Text>
          {!isStandalone && (
            <TouchableOpacity style={s.navAction} onPress={handleInstallClick}>
              <Text style={s.navActionText}>INSTALAR APP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <View style={s.heroSection}>
          <Animated.View entering={FadeIn.delay(300)}>
            <Text style={s.titleAgora}>ÁGORA</Text>
            <Text style={s.titleMujeres}>mujeres</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(700)} style={s.manifestoWrapper}>
            <View style={s.manifestoLine} />
            <Text style={s.manifestoText}>
              Donde el tiempo recupera su <Text style={s.italic}>consciencia</Text>.
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(1000)} style={s.heroCTAWrapper}>
            <TouchableOpacity style={s.heroCTA} onPress={() => router.push('/login')}>
              <Text style={s.heroCTAText}>ENTRAR AL SANTUARIO</Text>
              <Ionicons name="enter-outline" size={16} color="white" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── SHOWCASE ────────────────────────────────────────────────────── */}
        <View style={s.showcaseSection}>
          <Animated.View entering={FadeInDown.delay(300)} style={s.mockupContainer}>
            <LinearGradient colors={['#FDF8F2', '#F0E6D3', '#E8D5B8']} style={StyleSheet.absoluteFill} />

            {/* Columna izquierda — texto */}
            <View style={s.showcaseLeft}>
              <Text style={s.showcaseTag}>IA EMPÁTICA</Text>
              <Text style={s.showcaseTitle}>Tu santuario,{'\n'}siempre contigo.</Text>
              <Text style={s.showcaseSubtitle}>
                Una IA que te escucha sin juzgarte, disponible cuando más lo necesitas.
              </Text>

              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statNumber}>90'</Text>
                  <Text style={s.statLabel}>de prueba gratuita</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statNumber}>24/7</Text>
                  <Text style={s.statLabel}>siempre disponible</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statNumber}>100%</Text>
                  <Text style={s.statLabel}>privado y cifrado</Text>
                </View>
              </View>

              <View style={s.chipsRow}>
                {['💜 Diario privado', '🌿 Sin notificaciones', '🔒 Cifrado E2E', '🤫 Sin publicidad'].map(chip => (
                  <View key={chip} style={s.chip}>
                    <Text style={s.chipText}>{chip}</Text>
                  </View>
                ))}
              </View>

              <View style={s.downloadRow}>
                <TouchableOpacity style={s.downloadBtn} onPress={() => Linking.openURL('https://agoramujeres.syntexia-solutions.es/')}>
                  <Ionicons name="phone-portrait-outline" size={18} color="white" />
                  <View>
                    <Text style={s.downloadBtnSmall}>Disponible en</Text>
                    <Text style={s.downloadBtnBig}>App Nativa</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={s.downloadBtnOutline} onPress={() => router.push('/login')}>
                  <Ionicons name="globe-outline" size={18} color="#8B5A2B" />
                  <View>
                    <Text style={s.downloadBtnSmallDark}>Accede desde</Text>
                    <Text style={s.downloadBtnBigDark}>Versión Web</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Columna derecha — teléfono */}
            <View style={s.showcaseRight}>
              <View style={s.phoneFrame}>
                <View style={s.phoneNotch} />
                <View style={s.phoneScreen}>
                  <View style={s.appHeader}>
                    <Text style={s.appHeaderText}>Ágora</Text>
                    <View style={s.appHeaderDot} />
                  </View>
                  <View style={s.bubbleAssistant}>
                    <Text style={s.bubbleAssistantText}>Hola 💜 ¿Cómo te encuentras hoy?</Text>
                  </View>
                  <View style={s.bubbleUser}>
                    <Text style={s.bubbleUserText}>Me siento más tranquila que ayer.</Text>
                  </View>
                  <View style={s.bubbleAssistant}>
                    <Text style={s.bubbleAssistantText}>Eso es un gran avance. ¿Quieres que exploremos qué lo hizo posible?</Text>
                  </View>
                  <View style={s.phoneInput}>
                    <Text style={s.phoneInputText}>Escribe aquí...</Text>
                  </View>
                </View>
              </View>

              {/* Badge comunidad */}
              <View style={s.socialBadge}>
                <Text style={s.socialBadgeEmoji}>💜</Text>
                <View>
                  <Text style={s.socialBadgeTitle}>Comunidad activa</Text>
                  <Text style={s.socialBadgeSub}>Mujeres que ya confían en Ágora</Text>
                </View>
              </View>
            </View>

          </Animated.View>
        </View>

        {/* ── BENEFICIOS ──────────────────────────────────────────────────── */}
        <View style={s.sectionContainer}>
          <Text style={s.sectionLabel}>EL VALOR DEL SANTUARIO</Text>
          <View style={s.featuresGrid}>
            {[
              {
                icon: 'shield-checkmark-outline',
                title: 'Privacidad Ética',
                text: 'Tus datos son tu refugio, no nuestro producto.',
                bullets: ['Cifrado extremo a extremo', 'Sin venta de datos a terceros', 'Derecho al olvido garantizado'],
              },
              {
                icon: 'sparkles-outline',
                title: 'IA No Comercial',
                text: 'Una escucha activa que no entrena con tus secretos.',
                bullets: ['Sin publicidad dirigida', 'Respuestas empáticas y contextuales', 'Modelo sin fine-tuning comercial'],
              },
              {
                icon: 'leaf-outline',
                title: 'Tiempo Orgánico',
                text: 'Diseñada para reducir el ruido y reconectar contigo.',
                bullets: ['Sin notificaciones intrusivas', 'Modo offline disponible', 'Interfaz minimalista y calmante'],
              },
            ].map(f => (
              <View key={f.title} style={s.featureCard}>
                <View style={s.featureIconWrap}>
                  <Ionicons name={f.icon as any} size={26} color="#8B5A2B" />
                </View>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureText}>{f.text}</Text>
                <View style={s.featureDivider} />
                {f.bullets.map(b => (
                  <View key={b} style={s.featureBulletRow}>
                    <View style={s.featureBulletDot} />
                    <Text style={s.featureBulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* ── PROMO 1 MES GRATIS ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200)} style={[s.actionSection, { marginTop: D ? 60 : 32 }]}>
          <View style={{
            borderRadius: D ? 32 : 22,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: 'rgba(197,160,89,0.5)',
          }}>
            <LinearGradient
              colors={['rgba(197,160,89,0.12)', 'rgba(139,90,43,0.08)', 'rgba(197,160,89,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: D ? 48 : 28, alignItems: 'center' }}
            >
              <View style={{
                backgroundColor: '#8B5A2B',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
                marginBottom: D ? 20 : 14,
              }}>
                <Text style={{ fontSize: 10, color: 'white', fontWeight: '800', letterSpacing: 3 }}>
                  OFERTA DE LANZAMIENTO
                </Text>
              </View>

              <Text style={{
                fontSize: D ? 52 : 38,
                fontWeight: '100',
                color: '#8B5A2B',
                letterSpacing: 2,
                textAlign: 'center',
                lineHeight: D ? 58 : 44,
              }}>
                1 mes{'\n'}
                <Text style={{ color: '#C5A059', fontWeight: '300' }}>completamente gratis</Text>
              </Text>

              <View style={{ width: 36, height: 1, backgroundColor: '#C5A059', opacity: 0.5, marginVertical: D ? 20 : 14 }} />

              <Text style={{
                fontSize: D ? 16 : 14,
                color: '#8B5A2B',
                textAlign: 'center',
                opacity: 0.7,
                lineHeight: D ? 26 : 22,
                maxWidth: 460,
                marginBottom: D ? 28 : 20,
              }}>
                Entra hoy. Usa Ágora sin límites durante 30 días.{'\n'}
                Después, elige el plan que se adapte a ti.
              </Text>

              <View style={{ flexDirection: 'row', gap: D ? 32 : 20, marginBottom: D ? 32 : 22, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { icon: 'chatbubble-ellipses-outline', text: 'IA ilimitada 30 días' },
                  { icon: 'book-outline',                text: 'Diario personal' },
                  { icon: 'shield-checkmark-outline',    text: 'Sin pago inicial' },
                ].map(item => (
                  <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Ionicons name={item.icon as any} size={16} color="#C5A059" />
                    <Text style={{ fontSize: D ? 13 : 12, color: '#8B5A2B', fontWeight: '500' }}>{item.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#8B5A2B',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: D ? 40 : 28,
                  paddingVertical: D ? 16 : 14,
                  borderRadius: 40,
                  shadowColor: '#8B5A2B',
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
                onPress={() => router.push({ pathname: '/bienvenida', params: { intent: 'aurea' } } as any)}
                activeOpacity={0.85}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', letterSpacing: 2, fontSize: D ? 13 : 12 }}>
                  EMPEZAR MI MES GRATIS
                </Text>
                <Ionicons name="arrow-forward-outline" size={16} color="white" />
              </TouchableOpacity>

              <Text style={{ fontSize: 11, color: '#8B5A2B', opacity: 0.4, marginTop: D ? 14 : 10, textAlign: 'center' }}>
                Sin tarjeta de crédito. Sin permanencia. Cancela cuando quieras.
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* ── ACCESO ──────────────────────────────────────────────────────── */}
        <View style={s.actionSection}>
          <Text style={s.sectionLabel}>ELIGE TU ACCESO</Text>
          <View style={s.glassCápsula}>

            {/* ESENCIA */}
            <TouchableOpacity style={s.actionDoor} onPress={() => router.push('/login')} activeOpacity={0.85}>
              <Text style={s.cardLabel}>UMBRAL WEB · GRATIS</Text>
              <Text style={s.cardMainTitle}>Esencia</Text>
              <Text style={s.cardDesc}>Empieza sin compromiso. 90 minutos de cortesía para descubrir Ágora.</Text>
              <View style={s.pricingFeatureList}>
                {['90 min de IA incluidos', 'Diario personal cifrado', 'Seguimiento de ciclo', 'Acceso desde el navegador'].map(f => (
                  <View key={f} style={s.pricingFeatureRow}>
                    <Ionicons name="checkmark-outline" size={14} color="#C5A059" />
                    <Text style={s.pricingFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <View style={s.esenciaBtn}>
                <Text style={s.esenciaBtnText}>PROBAR GRATIS</Text>
                <Ionicons name="arrow-forward-outline" size={14} color="#8B5A2B" />
              </View>
            </TouchableOpacity>

            <View style={s.divider} />

            {/* ÁUREA */}
            <TouchableOpacity
              style={s.actionDoorPremium}
              onPress={() => router.push({ pathname: '/bienvenida', params: { intent: 'aurea' } } as any)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(139,90,43,0.07)', 'rgba(197,160,89,0.16)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.popularBadge}>
                <Text style={s.popularBadgeText}>✦ MÁS POPULAR</Text>
              </View>
              <Text style={s.cardLabelGold}>APP NATIVA · PREMIUM</Text>
              <Text style={s.cardMainTitleGold}>Áurea</Text>
              <Text style={s.cardDescGold}>Tu refugio completo, sin límites y siempre contigo.</Text>
              <View style={s.pricingFeatureList}>
                {['IA ilimitada 24/7', 'Modo offline completo', 'Historial y patrones de bienestar', 'Soporte prioritario'].map(f => (
                  <View key={f} style={s.pricingFeatureRow}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#8B5A2B" />
                    <Text style={s.pricingFeatureTextGold}>{f}</Text>
                  </View>
                ))}
              </View>
              <View style={s.goldActionPill}>
                <Text style={s.goldPillText}>COMENZAR AHORA</Text>
                <Ionicons name="arrow-forward-outline" size={14} color="white" />
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* ── CO-CREACIÓN ─────────────────────────────────────────────────── */}
        <View style={s.sectionContainer}>
          <Text style={s.sectionLabel}>CO-CREACIÓN</Text>
          <View style={s.feedbackWrapper}>
            <Text style={s.feedbackTitle}>Tu voz construye el santuario</Text>
            <Text style={s.feedbackSubtitle}>Estamos en fase de rediseño activo. Déjanos tu impresión.</Text>
            {!submitted ? (
              <View style={s.inputContainer}>
                <TextInput
                  style={s.textInput}
                  placeholder="¿Qué mejorarías de Ágora?"
                  placeholderTextColor="rgba(139,90,43,0.38)"
                  multiline
                  value={feedback}
                  onChangeText={setFeedback}
                />
                <TouchableOpacity
                  style={[s.sendButton, feedback.length <= 5 && { opacity: 0.45 }]}
                  onPress={handleSendFeedback}
                  disabled={feedback.length <= 5}
                >
                  <Text style={s.sendButtonText}>ENVIAR RESEÑA</Text>
                  <Ionicons name="paper-plane-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View entering={FadeIn} style={s.thanksContainer}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#8B5A2B" />
                <Text style={s.thanksText}>Gracias. Integraremos tu feedback en el próximo sprint.</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <View style={s.sectionContainer}>
          <Text style={s.sectionLabel}>PREGUNTAS FRECUENTES</Text>
          <View style={s.faqContainer}>
            <FAQItem question="¿Por qué existen los 90 minutos de cortesía?" answer="Cada sesión de reflexión consume recursos de IA de alto rendimiento (tokens). Ofrecemos este tiempo para que experimentes la calidad del acompañamiento empático de Ágora sin compromiso inicial." />
            <FAQItem question="¿Cómo protege Syntexia mis conversaciones?" answer="La privacidad es nuestro pilar técnico. No almacenamos historiales para entrenamiento comercial ni compartimos datos con terceros. Tus diálogos son cifrados y privados." />
            <FAQItem question="¿El diseño es igual en todos los dispositivos?" answer="Sí. Hemos desarrollado Ágora bajo una arquitectura de código único. Esto garantiza que tengas la misma experiencia de paz y elegancia tanto en tu iPhone/Android como en tu ordenador." />
            <FAQItem question="¿Necesito conexión a internet constante?" answer="Para la versión Web sí. Sin embargo, con nuestra App Nativa (Círculo Áurea) puedes acceder a ciertas funciones del santuario y herramientas de meditación en modo offline." />
            <FAQItem question="¿Puedo cancelar mi suscripción Áurea en cualquier momento?" answer="Por supuesto. No hay permanencias. Queremos que Ágora sea un lugar donde elijas estar, no una obligación." />
          </View>
        </View>

        {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
        <View style={s.finalCTA}>
          <LinearGradient
            colors={['rgba(197,160,89,0.05)', 'rgba(139,90,43,0.1)']}
            style={s.finalCTAGradient}
          />
          <Text style={s.finalTitle}>¿Lista para el silencio?</Text>
          <Text style={s.finalSubtitle}>Únete a las mujeres que ya han convertido su tiempo en consciencia.</Text>
          <TouchableOpacity style={s.mainButton} onPress={() => router.push('/login')}>
            <Text style={s.mainButtonText}>ENTRAR AL SANTUARIO</Text>
            <Ionicons name="enter-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <View style={s.footer}>
          <View style={s.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://syntexia-solutions.es/')}>
              <Text style={s.fLink}>SYNTEXIA SOLUTIONS</Text>
            </TouchableOpacity>
            <Text style={s.fDot}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://agoramujeres.syntexia-solutions.es/')}>
              <Text style={s.fLink}>SANTUARIO</Text>
            </TouchableOpacity>
            <Text style={s.fDot}>•</Text>
            <Text style={s.fLink}>PRIVACIDAD</Text>
          </View>
          <Text style={s.footerBrand}>MMXXVI · SYNTEXIA SOLUTIONS · ÁGORA</Text>
        </View>

      </ScrollView>
    </View>
  );
}
