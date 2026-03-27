import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';
import { ScreenContainer, GlassCard, PremiumButton } from '../../src/components/ui';
import { useStore } from '../../src/store/useStore';
import { useTrialCheck } from '../../src/hooks/useTrialCheck';
import { verifyAdminCode } from '../../src/services/api';
import { colors, textStyles, sp, radius, fonts } from '../../src/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, language, setLanguage, enableVoiceOutput, setEnableVoiceOutput } = useStore();
  const { isTrialActive, isSubscribed, remainingTime } = useTrialCheck();

  const [adminCode, setAdminCode]       = useState('');
  const [showAdmin, setShowAdmin]       = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);

  const toggleLang = async () => {
    const next = language === 'es' ? 'en' : 'es';
    await setLanguage(next);
    i18n.changeLanguage(next);
  };

  const handleAdminVerify = async () => {
    if (!deviceId || !adminCode.trim()) return;
    try {
      const res = await verifyAdminCode(deviceId, adminCode.trim());
      if (res.is_admin) setAdminVerified(true);
      else Alert.alert('Error', res.message);
    } catch { Alert.alert('Error', t('error')); }
  };

  return (
    <ScreenContainer title={t('settings')}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Suscripción ────────── */}
        <Text style={styles.sectionTitle}>{t('subscription')}</Text>
        <GlassCard>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons
                name={isSubscribed ? 'shield-checkmark' : 'time-outline'}
                size={20}
                color={isSubscribed ? colors.success : colors.secondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>
                {isSubscribed ? t('subscriptionActive') : t('trialRemaining')}
              </Text>
              {isTrialActive && <Text style={styles.rowValue}>{remainingTime}</Text>}
            </View>
            {!isSubscribed && (
              <TouchableOpacity onPress={() => router.push('/subscription')} style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>{t('priceMonthly')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* ── Idioma ─────────────── */}
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <GlassCard>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { flex: 1 }]}>{language === 'es' ? t('spanish') : t('english')}</Text>
            <TouchableOpacity onPress={toggleLang} style={styles.langToggle}>
              <Text style={styles.langToggleText}>{language === 'es' ? 'EN' : 'ES'}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ── Voz ────────────────── */}
        <Text style={styles.sectionTitle}>Audio</Text>
        <GlassCard>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="volume-high-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.rowLabel, { flex: 1 }]}>Síntesis de voz</Text>
            <Switch
              value={enableVoiceOutput}
              onValueChange={setEnableVoiceOutput}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={enableVoiceOutput ? colors.primary : colors.textMuted}
            />
          </View>
        </GlassCard>

        {/* ── Accesos rápidos ────── */}
        <Text style={styles.sectionTitle}>Herramientas</Text>
        {[
          { icon: 'calendar-outline' as const, label: t('monthlyRecord'), route: '/monthly-record' },
          { icon: 'flower-outline'   as const, label: t('cycleTracking'),  route: '/cycle' },
        ].map((item) => (
          <TouchableOpacity key={item.route} onPress={() => router.push(item.route as any)} activeOpacity={0.7}>
            <GlassCard style={styles.linkCard}>
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.rowLabel, { flex: 1 }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* ── Admin ──────────────── */}
        <TouchableOpacity onPress={() => setShowAdmin(!showAdmin)} style={styles.adminToggle}>
          <Text style={styles.adminToggleText}>Admin</Text>
        </TouchableOpacity>

        {showAdmin && (
          <GlassCard>
            {adminVerified ? (
              <View style={styles.adminVerified}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.adminVerifiedText}>Acceso admin activado</Text>
              </View>
            ) : (
              <View style={styles.adminForm}>
                <TextInput
                  style={styles.adminInput}
                  value={adminCode}
                  onChangeText={setAdminCode}
                  placeholder="Código admin"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
                <PremiumButton title="Verificar" onPress={handleAdminVerify} size="sm" />
              </View>
            )}
          </GlassCard>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },

  sectionTitle: {
    ...textStyles.labelCaps,
    color: colors.textMuted,
    marginTop: sp.lg,
    marginBottom: sp.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.sm,
  },
  rowIcon: {
    width: 36, height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...textStyles.subtitleSm, color: colors.textPrimary },
  rowValue: { ...textStyles.bodySm, color: colors.textMuted, marginTop: 2 },

  upgradeBtn: {
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: sp.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  upgradeBtnText: { ...textStyles.label, color: colors.secondary },

  langToggle: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: sp.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  langToggleText: { ...textStyles.label, color: colors.primary, fontFamily: fonts.sansBold },

  linkCard: { marginBottom: sp.sm },

  adminToggle: {
    alignItems: 'center',
    marginTop: sp.xl,
    paddingVertical: sp.sm,
  },
  adminToggleText: { ...textStyles.bodySm, color: colors.textMuted },

  adminForm: { flexDirection: 'row', gap: sp.sm, alignItems: 'center' },
  adminInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    paddingHorizontal: sp.md,
    paddingVertical: 10,
  },
  adminVerified: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  adminVerifiedText: { ...textStyles.subtitleSm, color: colors.success },
});
