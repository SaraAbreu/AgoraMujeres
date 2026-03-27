import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, PremiumButton, ScreenContainer } from '../src/components/ui';
import { useStore } from '../src/store/useStore';
import { useTrialCheck } from '../src/hooks/useTrialCheck';
import {
  getSubscriptionStatus,
  createCustomer,
  createPaymentIntent,
  activateSubscription,
} from '../src/services/api';
import { colors, textStyles, sp, radius, fonts } from '../src/theme';

const PLANS = [
  { id: 'monthly', priceLabel: '9.99 €/mes', priceCents: 999 },
];

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useStore();
  const { isTrialActive, remainingSeconds } = useTrialCheck();

  const [status, setStatus]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying]   = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    getSubscriptionStatus(deviceId)
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceId]);

  const isPremium = status?.is_active || isTrialActive;

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  };

  const handlePurchase = async () => {
    if (!deviceId) return;
    setBuying(true);
    try {
      const payment = await createPaymentIntent(deviceId);
      // In production this would open Stripe's payment sheet
      // For now we simulate a successful payment
      await activateSubscription(deviceId, payment.client_secret || 'demo');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✨', t('subscriptionActivated'));
      setStatus({ is_active: true, plan_type: 'monthly' });
    } catch {
      Alert.alert('Error', t('error'));
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('subscription')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <LinearGradient
          colors={colors.gradient.primary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Ágora Premium</Text>
          <Text style={styles.heroSub}>
            {isPremium ? t('premiumActive') : t('premiumDescription')}
          </Text>
        </LinearGradient>

        {/* Trial / Active badge */}
        {isTrialActive && !status?.is_active && (
          <GlassCard style={styles.trialBadge}>
            <Ionicons name="time-outline" size={20} color={colors.secondary} />
            <Text style={styles.trialText}>
              {t('trialActive')}: {formatTime(remainingSeconds * 1000)}
            </Text>
          </GlassCard>
        )}

        {status?.is_active && (
          <GlassCard style={styles.activeBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            <Text style={styles.activeText}>{t('subscriptionActive')}</Text>
          </GlassCard>
        )}

        {/* Features */}
        <Text style={styles.sectionTitle}>{t('whatYouGet')}</Text>
        {[
          { icon: 'chatbubbles-outline', text: t('featureChat') },
          { icon: 'book-outline',        text: t('featureDiary') },
          { icon: 'analytics-outline',   text: t('featurePatterns') },
          { icon: 'heart-outline',       text: t('featureCrisis') },
          { icon: 'calendar-outline',    text: t('featureCycle') },
        ].map((feat, i) => (
          <View key={i} style={styles.featureRow}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primarySoft]}
              style={styles.featureIcon}
            >
              <Ionicons name={feat.icon as any} size={18} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.featureText}>{feat.text}</Text>
          </View>
        ))}

        {/* Price + CTA */}
        {!status?.is_active && (
          <View style={styles.ctaSection}>
            <GlassCard style={styles.priceCard}>
              <Text style={styles.priceBig}>9.99 €</Text>
              <Text style={styles.priceUnit}>/ {t('month')}</Text>
            </GlassCard>
            <PremiumButton
              title={isTrialActive ? t('subscribeLater') : t('subscribe')}
              onPress={handlePurchase}
              loading={buying}
              disabled={buying}
              size="lg"
            />
            <Text style={styles.disclaimer}>{t('cancelAnytime')}</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: sp.screenX, paddingVertical: sp.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...textStyles.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: sp.screenX, paddingBottom: 40 },

  hero: {
    borderRadius: radius.xl,
    padding: sp.xl,
    alignItems: 'center',
    marginBottom: sp.lg,
  },
  heroLogo:  { width: 52, height: 52, tintColor: '#fff', marginBottom: sp.sm },
  heroTitle: { ...textStyles.h1, color: '#fff', marginBottom: sp.xs },
  heroSub:   { ...textStyles.body, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },

  trialBadge: {
    flexDirection: 'row', alignItems: 'center', gap: sp.sm,
    marginBottom: sp.md,
  },
  trialText: { ...textStyles.subtitleSm, color: colors.secondary },

  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: sp.sm,
    marginBottom: sp.md,
  },
  activeText: { ...textStyles.subtitleSm, color: colors.accent },

  sectionTitle: {
    ...textStyles.labelCaps, color: colors.textMuted,
    marginTop: sp.lg, marginBottom: sp.md,
  },

  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: sp.md,
    marginBottom: sp.md,
  },
  featureIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { ...textStyles.body, color: colors.textPrimary, flex: 1 },

  ctaSection: { marginTop: sp.xl, alignItems: 'center', gap: sp.md },
  priceCard:  { flexDirection: 'row', alignItems: 'baseline', gap: 4, alignSelf: 'center' },
  priceBig:   { ...textStyles.hero, color: colors.primary },
  priceUnit:  { ...textStyles.subtitle, color: colors.textMuted },
  disclaimer: { ...textStyles.bodySm, color: colors.textMuted, textAlign: 'center' },
});
