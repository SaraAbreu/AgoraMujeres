import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard, PremiumButton } from '../src/components/ui';
import { getCrisisSupport } from '../src/services/api';
import { useStore } from '../src/store/useStore';
import { colors, textStyles, sp, radius, fonts } from '../src/theme';

const CRISIS_PHONE = '024'; // Línea de atención a la conducta suicida (España)

export default function CrisisScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useStore();

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${CRISIS_PHONE}`);
  };

  const handleCrisisMsg = async () => {
    if (!deviceId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await getCrisisSupport(deviceId);
      // stay on crisis screen, show immediate support
    } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('crisis')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <LinearGradient
          colors={['#F0DFDF', '#F5E8E3', colors.bg]}
          style={styles.hero}
        >
          <View style={styles.heartCircle}>
            <Ionicons name="heart" size={32} color={colors.error} />
          </View>
          <Text style={styles.heroTitle}>{t('crisisTitle')}</Text>
          <Text style={styles.heroSub}>{t('crisisSubtitle')}</Text>
        </LinearGradient>

        {/* Llamar */}
        <GlassCard style={styles.callCard}>
          <Ionicons name="call" size={24} color={colors.error} />
          <View style={styles.callInfo}>
            <Text style={styles.callTitle}>{t('crisisCall')}</Text>
            <Text style={styles.callNumber}>{CRISIS_PHONE}</Text>
            <Text style={styles.callDesc}>{t('crisisCallDesc')}</Text>
          </View>
          <PremiumButton
            title={t('call')}
            onPress={handleCall}
            variant="secondary"
            size="sm"
          />
        </GlassCard>

        {/* Respiración */}
        <Text style={styles.sectionTitle}>{t('crisisBreathing')}</Text>
        <GlassCard style={styles.breathCard}>
          <Text style={styles.breathStep}>1. {t('breatheIn')}  —  4s</Text>
          <Text style={styles.breathStep}>2. {t('holdBreath')}  —  4s</Text>
          <Text style={styles.breathStep}>3. {t('breatheOut')}  —  6s</Text>
          <Text style={styles.breathStep}>4. {t('holdBreath')}  —  2s</Text>
          <Text style={styles.breathNote}>{t('breatheRepeat')}</Text>
        </GlassCard>

        {/* Grounding 5-4-3-2-1 */}
        <Text style={styles.sectionTitle}>{t('crisisGrounding')}</Text>
        <GlassCard>
          {[
            { n: 5, sense: t('groundSee'),   icon: 'eye-outline' },
            { n: 4, sense: t('groundTouch'), icon: 'hand-left-outline' },
            { n: 3, sense: t('groundHear'),  icon: 'ear-outline' },
            { n: 2, sense: t('groundSmell'), icon: 'flower-outline' },
            { n: 1, sense: t('groundTaste'), icon: 'restaurant-outline' },
          ].map((item, i) => (
            <View key={i} style={styles.groundRow}>
              <LinearGradient colors={colors.gradient.card as any} style={styles.groundCircle}>
                <Text style={styles.groundN}>{item.n}</Text>
              </LinearGradient>
              <Ionicons name={item.icon as any} size={18} color={colors.textMuted} />
              <Text style={styles.groundText}>{item.sense}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Hablar con Ágora */}
        <View style={styles.agoraSection}>
          <PremiumButton
            title={t('crisisTalkAgora')}
            onPress={() => { handleCrisisMsg(); router.replace('/(tabs)/chat'); }}
            size="lg"
            icon={<Ionicons name="chatbubble-ellipses" size={20} color="#fff" />}
          />
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>{t('crisisDisclaimer')}</Text>

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
    borderRadius: radius.xl, padding: sp.xl,
    alignItems: 'center', marginBottom: sp.lg,
  },
  heartCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(200,80,80,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: sp.sm,
  },
  heroTitle: { ...textStyles.h2, color: colors.textPrimary, textAlign: 'center' },
  heroSub:   { ...textStyles.body, color: colors.textSecondary, textAlign: 'center', marginTop: sp.xs },

  callCard: { flexDirection: 'row', alignItems: 'center', gap: sp.md, marginBottom: sp.lg },
  callInfo: { flex: 1 },
  callTitle:  { ...textStyles.subtitleSm, color: colors.textPrimary },
  callNumber: { ...textStyles.h3, color: colors.error, marginVertical: 2 },
  callDesc:   { ...textStyles.bodySm, color: colors.textMuted },

  sectionTitle: {
    ...textStyles.labelCaps, color: colors.textMuted,
    marginTop: sp.lg, marginBottom: sp.md,
  },

  breathCard: { gap: sp.sm },
  breathStep: { ...textStyles.body, color: colors.textPrimary },
  breathNote: { ...textStyles.bodySm, color: colors.textMuted, marginTop: sp.xs },

  groundRow: { flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginBottom: sp.sm },
  groundCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  groundN:    { ...textStyles.label, color: colors.primary, fontFamily: fonts.sansBold },
  groundText: { ...textStyles.body, color: colors.textPrimary, flex: 1 },

  agoraSection: { marginTop: sp.xl },

  disclaimer: {
    ...textStyles.bodySm, color: colors.textMuted,
    textAlign: 'center', marginTop: sp.lg,
    lineHeight: 18,
  },
});
