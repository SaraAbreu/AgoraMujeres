import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ScrollView, StatusBar, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../src/store/useStore';;
import {
  getSubscriptionStatus, createCustomer, createPaymentIntent,
  activateSubscription, type SubscriptionStatus,
} from '../src/services/api';

const T = {
  forest:'#4A664D', forestDim:'#3A5140', moss:'#6B8F6E', sage:'#A8C5A0',
  mint:'#D4E8D0', mintSoft:'#EAF4E8', cream:'#F8F7F2', parchment:'#F0EDE4',
  warm:'#E8E2D8', muted:'#9A958E', charcoal:'#3D3A35', white:'#FFFFFF',
  gold:'#C9A84C',
};

// ── Animated leaf bg ─────────────────────────────────────────
function FloatingLeaf({ delay, x, size }: { delay: number; x: number; size: number }) {
  const y = useRef(new Animated.Value(-20)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y,  { toValue: 600, duration: 8000, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(op, { toValue: 0.25, duration: 1500, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0,    duration: 1500, delay: 4000, useNativeDriver: true }),
        ]),
      ]),
    ])).start();
  }, []);
  return (
    <Animated.Text style={{ position: 'absolute', left: x, top: 0, fontSize: size, opacity: op, transform: [{ translateY: y }] }}>
      🍃
    </Animated.Text>
  );
}

// ── Plan card ────────────────────────────────────────────────
function PlanCard({ title, price, period, features, highlight, onPress, loading }:
  { title: string; price: string; period: string; features: string[]; highlight?: boolean; onPress: () => void; loading?: boolean }) {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.planCard, highlight && styles.planCardHL, { transform: [{ scale: sc }] }]}>
      {highlight && (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>Más acompañamiento</Text>
        </View>
      )}
      <Text style={styles.planTitle}>{title}</Text>
      <View style={styles.planPriceRow}>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planPeriod}>{period}</Text>
      </View>
      <View style={styles.planFeatures}>
        {features.map((f, i) => (
          <View key={i} style={styles.planFeatureRow}>
            <Ionicons name="leaf-outline" size={13} color={T.moss} />
            <Text style={styles.planFeatureText}>{f}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        onPressIn={() => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
        onPress={onPress}
        activeOpacity={1}
        disabled={loading}
      >
        <LinearGradient
          colors={highlight ? [T.forest, T.moss] : [T.parchment, T.warm]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.planBtn}
        >
          <Text style={[styles.planBtnText, !highlight && { color: T.forest }]}>
            {loading ? 'Procesando…' : 'Quedarme con Ágora'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId, userData } = useUserStore();

  const [sub, setSub]         = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (deviceId) getSubscriptionStatus(deviceId).then(setSub).catch(() => {});
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [deviceId]);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!deviceId) return;
    setLoading(plan);
    try {
      if (userData?.email) {
        await createCustomer(deviceId, userData.email, userData.name).catch(() => {});
      }
      const intent = await createPaymentIntent(deviceId);
      await activateSubscription(deviceId, intent.payment_intent_id || intent.id);
      Alert.alert('💚 Bienvenida', 'Ágora ya es tuya. Aquí estaremos, siempre.');
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Algo salió mal', 'Por favor, inténtalo de nuevo en un momento.');
    } finally {
      setLoading(null);
    }
  };

  const isExpired = sub?.status === 'expired';

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      <StatusBar barStyle="dark-content" />

      {/* Floating leaves decoration */}
      {[{ x: 30, d: 0, s: 18 }, { x: 160, d: 2000, s: 14 }, { x: 280, d: 4000, s: 16 }].map((l, i) => (
        <FloatingLeaf key={i} x={l.x} delay={l.d} size={l.s} />
      ))}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Expired message (warm transition) ── */}
          {isExpired && (
            <View style={styles.expiredCard}>
              <Text style={styles.expiredLeaf}>🌿</Text>
              <Text style={styles.expiredTitle}>
                Tu día de acompañamiento profundo ha terminado.
              </Text>
              <Text style={styles.expiredBody}>
                Si sientes que Ágora te ha ayudado, puedes quedarte conmigo el tiempo que necesites.
              </Text>
            </View>
          )}

          {/* ── Trial still active: soft upgrade prompt ── */}
          {!isExpired && (
            <View style={styles.softCard}>
              <Text style={styles.softEmoji}>🌱</Text>
              <Text style={styles.softTitle}>Ágora siempre está aquí</Text>
              <Text style={styles.softBody}>
                Cuando sientas que quieres un acompañamiento más profundo, aquí tienes tus opciones. Sin prisa.
              </Text>
            </View>
          )}

          {/* ── Plan cards ── */}
          <Text style={styles.plansLabel}>Opciones de acompañamiento</Text>

          <PlanCard
            title="Mensual"
            price="7.90 €"
            period="/ mes"
            features={[
              'Acceso ilimitado a Ágora',
              'Diario de alivio sin límites',
              'Análisis de patrones semanales',
              'Conversaciones sin restricciones',
            ]}
            onPress={() => handleSubscribe('monthly')}
            loading={loading === 'monthly'}
          />

          <PlanCard
            title="Anual"
            price="79,90 €"
            period="/ año · 7.90 €/mes"
            features={[
              'Todo lo del plan mensual',
              'Ahorro del 35%',
              'Prioridad en nuevas funciones',
              'Apoyas el proyecto directamente',
            ]}
            highlight
            onPress={() => handleSubscribe('yearly')}
            loading={loading === 'yearly'}
          />

          {/* Bottom note */}
          <View style={styles.bottomNote}>
            <Ionicons name="lock-closed-outline" size={14} color={T.muted} />
            <Text style={styles.bottomNoteText}>
              Pago seguro · Cancela cuando quieras · Sin compromisos
            </Text>
          </View>

          {/* Back button if not expired */}
          {!isExpired && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Ahora no, volver al refugio</Text>
            </TouchableOpacity>
          )}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 16 },

  expiredCard: {
    backgroundColor: T.white, borderRadius: 24, padding: 28,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    marginBottom: 4,
  },
  expiredLeaf:  { fontSize: 52, marginBottom: 16 },
  expiredTitle: { fontSize: 20, fontWeight: '700', color: T.charcoal, textAlign: 'center', lineHeight: 28, marginBottom: 12 },
  expiredBody:  { fontSize: 15, color: T.muted, textAlign: 'center', lineHeight: 24, fontStyle: 'italic' },

  softCard: {
    backgroundColor: T.mintSoft, borderRadius: 20, padding: 22,
    alignItems: 'center', borderWidth: 1, borderColor: T.mint,
  },
  softEmoji: { fontSize: 36, marginBottom: 10 },
  softTitle: { fontSize: 18, fontWeight: '700', color: T.charcoal, textAlign: 'center', marginBottom: 8 },
  softBody:  { fontSize: 14, color: T.muted, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },

  plansLabel: {
    fontSize: 10, fontWeight: '700', color: T.muted,
    textTransform: 'uppercase', letterSpacing: 2.5, marginTop: 8,
  },

  planCard: {
    backgroundColor: T.white, borderRadius: 22, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  planCardHL: {
    backgroundColor: T.forestDim,
    shadowColor: T.forest, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  planBadge: {
    backgroundColor: T.mint, borderRadius: 100,
    paddingVertical: 4, paddingHorizontal: 12,
    alignSelf: 'flex-start', marginBottom: 14,
  },
  planBadgeText: { fontSize: 10, fontWeight: '700', color: T.forest, textTransform: 'uppercase', letterSpacing: 1 },
  planTitle:    { fontSize: 13, fontWeight: '600', color: T.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 18 },
  planPrice:    { fontSize: 36, fontWeight: '800', color: T.charcoal },
  planPeriod:   { fontSize: 13, color: T.muted, marginBottom: 6 },
  planFeatures: { gap: 8, marginBottom: 20 },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planFeatureText:{ fontSize: 13, color: T.charcoal, lineHeight: 20 },
  planBtn: {
    borderRadius: 16, paddingVertical: 15, alignItems: 'center',
    shadowColor: T.forest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  planBtnText: { color: T.white, fontSize: 15, fontWeight: '700' },

  bottomNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginTop: 4,
  },
  bottomNoteText: { fontSize: 11, color: T.muted, fontStyle: 'italic' },

  backBtn: { alignItems: 'center', marginTop: 8 },
  backBtnText: { fontSize: 13, color: T.muted },
});