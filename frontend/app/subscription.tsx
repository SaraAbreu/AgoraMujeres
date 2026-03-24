/**
 * app/subscription.tsx
 *
 * Pantalla de suscripción — tres estados:
 *   1. trial   → muestra tiempo restante + botón de activar
 *   2. active  → confirmación, gestión
 *   3. expired → bloqueo suave + CTA urgente
 *
 * Flujo de pago (preparado para Stripe Payment Sheet):
 *   createCustomer → createPaymentIntent → [Stripe Sheet] → activateSubscription
 *
 * En desarrollo/sin Stripe SDK: muestra Alert de simulación (igual que antes)
 * pero la activación se verifica en el backend (no bypass).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius, typography } from '../src/theme/colors';
import { useStore } from '../src/store/useStore';
import {
  getSubscriptionStatus,
  createCustomer,
  createPaymentIntent,
  activateSubscription,
  SubscriptionStatus,
} from '../src/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const BG      = '#80704f';
const PRICE   = '10€';
const PERIOD  = '/mes';

const FEATURES = [
  { icon: 'chatbubbles-outline',  es: 'Chat ilimitado con Ágora',           en: 'Unlimited chat with Ágora'        },
  { icon: 'analytics-outline',    es: 'Análisis de patrones personalizados', en: 'Personalized pattern analysis'    },
  { icon: 'calendar-outline',     es: 'Registro mensual de dolor',           en: 'Monthly pain tracking'            },
  { icon: 'leaf-outline',         es: 'Técnicas de bienestar guiadas',       en: 'Guided wellness techniques'       },
  { icon: 'heart-outline',        es: 'Soporte de crisis 24/7',              en: 'Crisis support 24/7'              },
  { icon: 'library-outline',      es: 'Acceso a todos los recursos',         en: 'Access to all resources'          },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatSeconds(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconBg}>
        <Ionicons name={icon as any} size={16} color={colors.mossGreen} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pantalla
// ─────────────────────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const router = useRouter();
  const { deviceId, language, setSubscriptionStatus } = useStore();
  const isEs = language === 'es';

  const [status,  setStatus]  = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario de pago
  const [step,    setStep]    = useState<'features' | 'form'>('features');
  const [email,   setEmail]   = useState('');
  const [name,    setName]    = useState('');
  const [paying,  setPaying]  = useState(false);

  // ── Cargar estado de suscripción ─────────────────────────────────────────
  useEffect(() => {
    if (!deviceId) return;
    getSubscriptionStatus(deviceId)
      .then(s => { setStatus(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [deviceId]);

  // ── Flujo de pago ────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!email.trim()) {
      Alert.alert(
        isEs ? 'Email requerido' : 'Email required',
        isEs ? 'Introduce tu correo electrónico' : 'Please enter your email'
      );
      return;
    }
    if (!email.includes('@')) {
      Alert.alert(
        isEs ? 'Email inválido' : 'Invalid email',
        isEs ? 'Introduce un email válido' : 'Please enter a valid email'
      );
      return;
    }
    if (!deviceId) return;

    setPaying(true);
    try {
      // 1. Crear cliente en Stripe
      await createCustomer(
        deviceId,
        email.trim(),
        name.trim() || undefined
      );

      // 2. Crear PaymentIntent
      const { client_secret, payment_intent_id } = await createPaymentIntent(deviceId);

      // 3. Mostrar Stripe Payment Sheet
      //    Si tienes @stripe/stripe-react-native instalado, sustituye el Alert
      //    por initPaymentSheet + presentPaymentSheet.
      //    Por ahora: simulación que llama al backend para activar.

      Alert.alert(
        isEs ? '💳 Pago' : '💳 Payment',
        isEs
          ? `Integra @stripe/stripe-react-native para el pago real.\n\n¿Simular pago exitoso? (solo para desarrollo)`
          : `Integrate @stripe/stripe-react-native for real payment.\n\nSimulate successful payment? (dev only)`,
        [
          {
            text: isEs ? 'Simular pago' : 'Simulate payment',
            onPress: async () => {
              try {
                await activateSubscription(deviceId, payment_intent_id);
                const newStatus = await getSubscriptionStatus(deviceId);
                setStatus(newStatus);
                setSubscriptionStatus(newStatus);
                setStep('features');
                Alert.alert(
                  '✓',
                  isEs ? '¡Suscripción activada! Bienvenida a Ágora Premium.' : 'Subscription activated! Welcome to Ágora Premium.'
                );
              } catch (e: any) {
                Alert.alert(isEs ? 'Error' : 'Error', e?.message ?? '');
              }
            },
          },
          { text: isEs ? 'Cancelar' : 'Cancel', style: 'cancel' },
        ]
      );
    } catch (e: any) {
      Alert.alert(isEs ? 'Error' : 'Error', e?.message ?? '');
    } finally {
      setPaying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.softWhite} />
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Estado: ACTIVE
  // ─────────────────────────────────────────────────────────────────────────
  if (status?.status === 'active') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => router.back()} isEs={isEs} />
        <ScrollView contentContainerStyle={styles.content}>

          {/* Confirmación */}
          <View style={styles.activeCard}>
            <View style={styles.activeIconBg}>
              <Ionicons name="checkmark-circle" size={48} color={colors.mossGreen} />
            </View>
            <Text style={styles.activeTitle}>
              {isEs ? '¡Suscripción activa!' : 'Subscription active!'}
            </Text>
            <Text style={styles.activeSub}>
              {isEs
                ? 'Tienes acceso completo a todas las funciones de Ágora.'
                : 'You have full access to all Ágora features.'}
            </Text>
            {status.is_admin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color={colors.warmBrown} />
                <Text style={styles.adminBadgeText}>
                  {isEs ? 'Acceso de administrador' : 'Admin access'}
                </Text>
              </View>
            )}
          </View>

          {/* Lista de features */}
          <Text style={styles.sectionLabel}>
            {isEs ? 'Incluido en tu plan' : "What's included"}
          </Text>
          <View style={styles.featuresCard}>
            {FEATURES.map((f, i) => (
              <FeatureRow
                key={i}
                icon={f.icon}
                text={isEs ? f.es : f.en}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color={colors.softWhite} />
            <Text style={styles.backHomeBtnText}>
              {isEs ? 'Volver al inicio' : 'Back to home'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Estado: EXPIRED
  // ─────────────────────────────────────────────────────────────────────────
  if (status?.status === 'expired') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => router.back()} isEs={isEs} />
        <ScrollView contentContainerStyle={styles.content}>

          <View style={styles.expiredBanner}>
            <Ionicons name="time-outline" size={32} color="#fff" />
            <Text style={styles.expiredTitle}>
              {isEs ? 'Tu prueba ha terminado' : 'Your trial has ended'}
            </Text>
            <Text style={styles.expiredSub}>
              {isEs
                ? 'Activa tu suscripción para seguir hablando con Ágora y registrando tu bienestar.'
                : 'Activate your subscription to keep talking with Ágora and tracking your wellbeing.'}
            </Text>
          </View>

          <PaymentForm
            step={step}
            setStep={setStep}
            email={email}
            setEmail={setEmail}
            name={name}
            setName={setName}
            paying={paying}
            onPay={handlePay}
            isEs={isEs}
            urgent
          />

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Estado: TRIAL (default)
  // ─────────────────────────────────────────────────────────────────────────
  const remaining = status?.trial_remaining_seconds ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => router.back()} isEs={isEs} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Timer de prueba */}
        <View style={styles.trialBanner}>
          <Text style={styles.trialBannerLabel}>
            {isEs ? 'Tiempo de prueba restante' : 'Trial time remaining'}
          </Text>
          <Text style={styles.trialTimer}>{formatSeconds(remaining)}</Text>
          <Text style={styles.trialBannerSub}>
            {isEs
              ? 'Cuando expire, necesitarás una suscripción para continuar.'
              : 'When it expires, you will need a subscription to continue.'}
          </Text>
        </View>

        {/* Precio */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{PRICE}</Text>
          <Text style={styles.pricePeriod}>{PERIOD}</Text>
          <Text style={styles.priceNote}>
            {isEs ? '· Cancela cuando quieras' : '· Cancel anytime'}
          </Text>
        </View>

        {/* Features */}
        <Text style={styles.sectionLabel}>
          {isEs ? '¿Qué incluye?' : "What's included?"}
        </Text>
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={i} icon={f.icon} text={isEs ? f.es : f.en} />
          ))}
        </View>

        {/* Formulario de pago */}
        <PaymentForm
          step={step}
          setStep={setStep}
          email={email}
          setEmail={setEmail}
          name={name}
          setName={setName}
          paying={paying}
          onPay={handlePay}
          isEs={isEs}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

function Header({ onBack, isEs }: { onBack: () => void; isEs: boolean }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={colors.softWhite} />
      </TouchableOpacity>
      <View>
        <Text style={styles.headerTitle}>
          {isEs ? 'Ágora Premium' : 'Ágora Premium'}
        </Text>
        <Text style={styles.headerSub}>
          {isEs ? 'Tu refugio sin límites' : 'Your limitless refuge'}
        </Text>
      </View>
    </View>
  );
}

function PaymentForm({
  step, setStep,
  email, setEmail,
  name, setName,
  paying, onPay,
  isEs, urgent = false,
}: {
  step:     'features' | 'form';
  setStep:  (s: 'features' | 'form') => void;
  email:    string;
  setEmail: (v: string) => void;
  name:     string;
  setName:  (v: string) => void;
  paying:   boolean;
  onPay:    () => void;
  isEs:     boolean;
  urgent?:  boolean;
}) {
  if (step === 'features') {
    return (
      <TouchableOpacity
        style={[styles.ctaBtn, urgent && styles.ctaBtnUrgent]}
        onPress={() => setStep('form')}
        activeOpacity={0.85}
      >
        <Ionicons name="star" size={18} color="#fff" />
        <Text style={styles.ctaBtnText}>
          {isEs ? 'Activar suscripción — 10€/mes' : 'Activate subscription — €10/month'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => setStep('features')} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.formTitle}>
          {isEs ? 'Información de pago' : 'Payment info'}
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder={isEs ? 'Tu nombre (opcional)' : 'Your name (optional)'}
        placeholderTextColor={colors.textLight}
        value={name}
        onChangeText={setName}
        editable={!paying}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="correo@ejemplo.com"
        placeholderTextColor={colors.textLight}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!paying}
      />

      <View style={styles.securityNote}>
        <Ionicons name="lock-closed-outline" size={13} color={colors.mossGreen} />
        <Text style={styles.securityText}>
          {isEs
            ? 'Tu información está protegida por Stripe'
            : 'Your information is secured by Stripe'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.payBtn, paying && styles.payBtnDisabled]}
        onPress={onPay}
        disabled={paying}
        activeOpacity={0.85}
      >
        {paying
          ? <ActivityIndicator color="#fff" />
          : <>
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.payBtnText}>
                {isEs ? 'Pagar 10€ y activar' : 'Pay €10 and activate'}
              </Text>
            </>
        }
      </TouchableOpacity>

      <Text style={styles.cancelNote}>
        {isEs
          ? 'Cancela en cualquier momento desde ajustes.'
          : 'Cancel anytime from settings.'}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: BG,
  },
  loader: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
  },
  content: {
    padding:       spacing.lg,
    paddingBottom: 60,
  },

  // Header
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: spacing.lg,
    paddingVertical:  spacing.md,
    gap:              spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize:   typography.sizes.lg,
    fontFamily: 'Cormorant_700Bold',
    color:      colors.softWhite,
  },
  headerSub: {
    fontSize:   typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(245,242,239,0.7)',
    marginTop:  1,
  },

  // Trial banner
  trialBanner: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius:    borderRadius.lg,
    padding:         spacing.lg,
    alignItems:      'center',
    marginBottom:    spacing.lg,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
  },
  trialBannerLabel: {
    fontSize:     typography.sizes.sm,
    fontFamily:   'Nunito_500Medium',
    color:        'rgba(245,242,239,0.8)',
    marginBottom: spacing.sm,
  },
  trialTimer: {
    fontSize:     36,
    fontFamily:   'Cormorant_700Bold',
    color:        colors.softWhite,
    letterSpacing: 2,
    marginBottom:  spacing.sm,
  },
  trialBannerSub: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(245,242,239,0.65)',
    textAlign:  'center',
    lineHeight: 20,
  },

  // Precio
  priceRow: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'center',
    gap:            4,
    marginBottom:   spacing.lg,
  },
  price: {
    fontSize:   32,
    fontFamily: 'Cormorant_700Bold',
    color:      colors.softWhite,
  },
  pricePeriod: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_500Medium',
    color:      'rgba(245,242,239,0.8)',
  },
  priceNote: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(245,242,239,0.6)',
  },

  // Section label
  sectionLabel: {
    fontSize:     typography.sizes.sm,
    fontFamily:   'Nunito_600SemiBold',
    color:        'rgba(245,242,239,0.85)',
    marginBottom: spacing.sm,
  },

  // Features card
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.md,
    marginBottom:    spacing.lg,
    gap:             spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
    paddingVertical: 2,
  },
  featureIconBg: {
    width:          32,
    height:         32,
    borderRadius:   8,
    backgroundColor: colors.mossGreen + '18',
    justifyContent: 'center',
    alignItems:     'center',
  },
  featureText: {
    flex:       1,
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      colors.text,
    lineHeight: 20,
  },

  // CTA button
  ctaBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    backgroundColor: colors.warmBrownDark,
    paddingVertical: spacing.lg,
    borderRadius:    borderRadius.lg,
    marginBottom:    spacing.md,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.2,
    shadowRadius:    6,
    elevation:       4,
  },
  ctaBtnUrgent: {
    backgroundColor: '#8B2020',
  },
  ctaBtnText: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_700Bold',
    color:      '#fff',
  },

  // Payment form card
  formCard: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.lg,
    marginBottom:    spacing.md,
  },
  formHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.sm,
    marginBottom:   spacing.lg,
  },
  formTitle: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color:      colors.text,
  },
  input: {
    backgroundColor: colors.creamLight,
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.md,
    fontSize:        typography.sizes.md,
    fontFamily:      'Nunito_400Regular',
    color:           colors.text,
    marginBottom:    spacing.md,
  },
  securityNote: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.xs,
    marginBottom:   spacing.lg,
  },
  securityText: {
    fontSize:   typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color:      colors.mossGreen,
  },
  payBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    backgroundColor: colors.mossGreen,
    paddingVertical: spacing.lg,
    borderRadius:    borderRadius.md,
    marginBottom:    spacing.sm,
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  payBtnText: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_700Bold',
    color:      '#fff',
  },
  cancelNote: {
    fontSize:   typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color:      colors.textLight,
    textAlign:  'center',
  },

  // Active state
  activeCard: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.xl,
    alignItems:      'center',
    marginBottom:    spacing.lg,
  },
  activeIconBg: {
    width:          80,
    height:         80,
    borderRadius:   40,
    backgroundColor: colors.mossGreen + '15',
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   spacing.md,
  },
  activeTitle: {
    fontSize:     typography.sizes.xl,
    fontFamily:   'Cormorant_700Bold',
    color:        colors.text,
    marginBottom: spacing.sm,
    textAlign:    'center',
  },
  activeSub: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color:      colors.textSecondary,
    textAlign:  'center',
    lineHeight: 22,
  },
  adminBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    backgroundColor:  colors.warmBrown + '15',
    paddingHorizontal: spacing.md,
    paddingVertical:  spacing.xs,
    borderRadius:     borderRadius.full,
    marginTop:        spacing.md,
  },
  adminBadgeText: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color:      colors.warmBrown,
  },

  // Expired state
  expiredBanner: {
    backgroundColor: '#8B2020',
    borderRadius:    borderRadius.lg,
    padding:         spacing.xl,
    alignItems:      'center',
    marginBottom:    spacing.lg,
    gap:             spacing.sm,
  },
  expiredTitle: {
    fontSize:   typography.sizes.lg,
    fontFamily: 'Cormorant_700Bold',
    color:      '#fff',
    textAlign:  'center',
  },
  expiredSub: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(255,255,255,0.85)',
    textAlign:  'center',
    lineHeight: 20,
  },

  // Back home button (estado active)
  backHomeBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    backgroundColor: colors.warmBrownDark,
    paddingVertical: spacing.lg,
    borderRadius:    borderRadius.lg,
    marginTop:       spacing.md,
  },
  backHomeBtnText: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_700Bold',
    color:      colors.softWhite,
  },
});
