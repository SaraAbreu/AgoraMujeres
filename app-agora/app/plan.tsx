import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Dimensions, Linking, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store/userStore';

// ─── CONFIGURA AQUÍ tu endpoint de backend ───────────────────────────────────
// Tu backend debe crear una Stripe Checkout Session y devolver { url: string }
const STRIPE_CHECKOUT_ENDPOINT = 'https://tu-backend.com/api/stripe/create-checkout';
// ─────────────────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');
const colorText   = '#8B5A2B';
const colorAccent = '#C5A059';

type PlanId = 'libre' | 'aurea' | 'diamante';

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  priceId: string;       // Stripe Price ID de tu dashboard
  highlight: boolean;
  badge?: string;
  features: { text: string; included: boolean }[];
}

const PLANS: Plan[] = [
  {
    id: 'libre',
    name: 'Exploración',
    price: 'Gratis',
    period: '',
    priceId: '',
    highlight: false,
    features: [
      { text: '90 minutos diarios en el santuario', included: true },
      { text: 'Diario personal', included: true },
      { text: 'Chat con Ágora (limitado)', included: true },
      { text: 'Acceso ilimitado', included: false },
      { text: 'Historial clínico completo', included: false },
      { text: 'Informe médico PDF', included: false },
      { text: 'Recordatorios personalizados', included: false },
    ],
  },
  {
    id: 'aurea',
    name: 'Plan Áurea',
    price: '9,99 €',
    period: '/ mes',
    priceId: 'price_XXXX_aurea',   // ← reemplaza con tu Price ID de Stripe
    highlight: true,
    badge: 'MÁS POPULAR',
    features: [
      { text: 'Acceso ilimitado al santuario', included: true },
      { text: 'Diario personal', included: true },
      { text: 'Chat ilimitado con Ágora', included: true },
      { text: 'Historial clínico completo', included: true },
      { text: 'Informe médico PDF', included: true },
      { text: 'Recordatorios personalizados', included: true },
      { text: 'Soporte prioritario', included: false },
    ],
  },
  {
    id: 'diamante',
    name: 'Plan Diamante',
    price: '24,99 €',
    period: '/ mes',
    priceId: 'price_XXXX_diamante', // ← reemplaza con tu Price ID de Stripe
    highlight: false,
    badge: 'COMPLETO',
    features: [
      { text: 'Todo lo del Plan Áurea', included: true },
      { text: 'Soporte prioritario 24/7', included: true },
      { text: 'Consulta médica mensual', included: true },
      { text: 'Análisis avanzado de síntomas', included: true },
      { text: 'Acceso anticipado a nuevas features', included: true },
      { text: 'Exportación de datos completa', included: true },
      { text: 'Sesiones grupales en comunidad', included: true },
    ],
  },
];

export default function PlanScreen() {
  const router   = useRouter();
  const user     = useUserStore((state) => state.user);
  const [loading, setLoading] = useState<PlanId | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.priceId) return; // Plan gratuito, no hace nada

    setLoading(plan.id);
    try {
      const response = await fetch(STRIPE_CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId:    plan.priceId,
          userId:     user?.id,
          userEmail:  user?.email,
          successUrl: 'agora://plan-success',  // deep link de retorno
          cancelUrl:  'agora://plan-cancel',
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data?.url) {
        await Linking.openURL(data.url);
      } else {
        throw new Error('No se recibió URL de checkout');
      }
    } catch (error) {
      Alert.alert(
        'Error al procesar el pago',
        'No pudimos conectar con el servidor. Inténtalo de nuevo en unos momentos.',
        [{ text: 'Entendido' }]
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colorText} />
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>ÁGORA MUJERES</Text>
          <Text style={styles.title}>Elige tu plan</Text>
          <Text style={styles.subtitle}>
            Invierte en tu bienestar.{'\n'}Cancela cuando quieras.
          </Text>
        </View>

        {/* Tarjetas de planes */}
        {PLANS.map((plan) => {
          const isLoading   = loading === plan.id;
          const isHighlight = plan.highlight;

          return (
            <View key={plan.id} style={[styles.card, isHighlight && styles.cardHighlight]}>
              {/* Badge */}
              {plan.badge && (
                <View style={[styles.badge, isHighlight ? styles.badgeHighlight : styles.badgeNormal]}>
                  <Text style={[styles.badgeText, isHighlight && styles.badgeTextHighlight]}>
                    {plan.badge}
                  </Text>
                </View>
              )}

              {/* Nombre y precio */}
              <Text style={[styles.planName, isHighlight && styles.planNameHighlight]}>
                {plan.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.price, isHighlight && styles.priceHighlight]}>
                  {plan.price}
                </Text>
                {!!plan.period && (
                  <Text style={[styles.period, isHighlight && styles.periodHighlight]}>
                    {plan.period}
                  </Text>
                )}
              </View>

              {/* Divider */}
              <View style={[styles.divider, isHighlight && styles.dividerHighlight]} />

              {/* Features */}
              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons
                      name={f.included ? 'checkmark-circle' : 'close-circle-outline'}
                      size={16}
                      color={f.included ? (isHighlight ? '#fff' : colorAccent) : (isHighlight ? 'rgba(255,255,255,0.3)' : 'rgba(139,90,43,0.25)')}
                    />
                    <Text style={[
                      styles.featureText,
                      isHighlight && styles.featureTextHighlight,
                      !f.included && styles.featureTextMuted,
                      !f.included && isHighlight && styles.featureTextMutedHighlight,
                    ]}>
                      {f.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Botón */}
              {plan.id === 'libre' ? (
                <View style={styles.currentPlanBtn}>
                  <Text style={styles.currentPlanText}>Plan actual</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.subscribeBtn, isHighlight && styles.subscribeBtnHighlight]}
                  onPress={() => handleSubscribe(plan)}
                  activeOpacity={0.85}
                  disabled={!!loading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={isHighlight ? colorText : 'white'} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="card-outline"
                        size={16}
                        color={isHighlight ? colorText : 'white'}
                      />
                      <Text style={[styles.subscribeBtnText, isHighlight && styles.subscribeBtnTextHighlight]}>
                        Suscribirme ahora
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Nota legal */}
        <View style={styles.legalBlock}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colorText} style={{ opacity: 0.4 }} />
          <Text style={styles.legalText}>
            Pago seguro con Stripe. Puedes cancelar en cualquier momento desde tu perfil. Sin permanencia.
          </Text>
        </View>

        <Text style={styles.footerBrand}>Syntexia Solutions</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 55, paddingBottom: 60 },

  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  headerBlock: { marginBottom: 32, alignItems: 'center' },
  eyebrow: { fontSize: 10, letterSpacing: 4, color: colorAccent, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '200', color: colorText, letterSpacing: 1, marginBottom: 10 },
  subtitle: { fontSize: 14, color: colorText, opacity: 0.55, textAlign: 'center', lineHeight: 22 },

  // ── Tarjeta normal ──
  card: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 28,
    padding: 26,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  // ── Tarjeta destacada ──
  cardHighlight: {
    backgroundColor: colorText,
    borderColor: colorText,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeNormal: {
    backgroundColor: 'rgba(197,160,89,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.3)',
  },
  badgeHighlight: { backgroundColor: colorAccent },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colorAccent },
  badgeTextHighlight: { color: colorText },

  planName: { fontSize: 20, fontWeight: '300', color: colorText, marginBottom: 6 },
  planNameHighlight: { color: 'white' },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 20 },
  price: { fontSize: 36, fontWeight: '200', color: colorText },
  priceHighlight: { color: 'white' },
  period: { fontSize: 14, color: colorText, opacity: 0.5 },
  periodHighlight: { color: 'rgba(255,255,255,0.6)', opacity: 1 },

  divider: { height: 1, backgroundColor: 'rgba(139,90,43,0.1)', marginBottom: 20 },
  dividerHighlight: { backgroundColor: 'rgba(255,255,255,0.15)' },

  featureList: { gap: 12, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13, color: colorText, fontWeight: '300', flex: 1 },
  featureTextHighlight: { color: 'rgba(255,255,255,0.9)' },
  featureTextMuted: { color: colorText, opacity: 0.3 },
  featureTextMutedHighlight: { color: 'rgba(255,255,255,0.3)', opacity: 1 },

  currentPlanBtn: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,90,43,0.2)',
    alignItems: 'center',
  },
  currentPlanText: { fontSize: 13, color: colorText, opacity: 0.4, letterSpacing: 1 },

  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colorText,
    padding: 16,
    borderRadius: 14,
  },
  subscribeBtnHighlight: { backgroundColor: colorAccent },
  subscribeBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  subscribeBtnTextHighlight: { color: colorText },

  legalBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  legalText: {
    flex: 1,
    fontSize: 11,
    color: colorText,
    opacity: 0.4,
    lineHeight: 17,
  },

  footerBrand: {
    textAlign: 'center',
    fontSize: 11,
    color: colorText,
    opacity: 0.25,
    letterSpacing: 1.5,
    fontWeight: '300',
  },
});