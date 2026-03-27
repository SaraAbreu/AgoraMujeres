import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer, GlassCard, EmptyState } from '../../src/components/ui';
import { useStore } from '../../src/store/useStore';
import { getPatterns, type Patterns } from '../../src/services/api';
import { colors, textStyles, sp, radius, fonts } from '../../src/theme';

export default function PatternsScreen() {
  const { t } = useTranslation();
  const { deviceId } = useStore();
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [days, setDays]         = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!deviceId) return;
    try { setPatterns(await getPatterns(deviceId, days)); } catch { /* noop */ }
  };

  useEffect(() => { load(); }, [deviceId, days]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!patterns || patterns.total_entries === 0) {
    return (
      <ScreenContainer title={t('weeklyPatterns')}>
        <EmptyState icon="analytics-outline" title={t('noPatterns')} message={t('keepWriting')} />
      </ScreenContainer>
    );
  }

  const emotionEntries = Object.entries(patterns.emotional_averages || {})
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .sort(([, a], [, b]) => (b as number) - (a as number));

  const physicalEntries = patterns.physical_averages
    ? [
        { key: 'nivel_dolor',  val: patterns.physical_averages.nivel_dolor },
        { key: 'energia',      val: patterns.physical_averages.energia },
        { key: 'sensibilidad', val: patterns.physical_averages.sensibilidad },
      ]
    : [];

  return (
    <ScreenContainer title={t('weeklyPatterns')} subtitle={`${patterns.total_entries} ${t('entries')} · ${t('lastDays', { days })}`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          {[7, 30].map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDays(d)}
              style={[styles.periodBtn, days === d && styles.periodBtnActive]}
            >
              <Text style={[styles.periodText, days === d && styles.periodTextActive]}>
                {d} {t('lastDays', { days: d }).split(' ').pop()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emotional trends */}
        <Text style={styles.sectionTitle}>{t('emotionalTrends')}</Text>
        <GlassCard style={styles.chartCard}>
          {emotionEntries.map(([key, val]) => {
            const ratio = (val as number) / 5;
            const emotionColor = (colors.emotion as any)[key] || colors.primary;
            return (
              <View key={key} style={styles.barRow}>
                <Text style={styles.barLabel}>{t(key)}</Text>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={[emotionColor, emotionColor + '80']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.barFill, { width: `${Math.max(ratio * 100, 5)}%` }]}
                  />
                </View>
                <Text style={[styles.barValue, { color: emotionColor }]}>{(val as number).toFixed(1)}</Text>
              </View>
            );
          })}
        </GlassCard>

        {/* Physical trends */}
        {physicalEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('physicalTrends')}</Text>
            <GlassCard style={styles.chartCard}>
              {physicalEntries.map(({ key, val }) => {
                const ratio = val / 10;
                return (
                  <View key={key} style={styles.barRow}>
                    <Text style={styles.barLabel}>{t(key)}</Text>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={[colors.secondary, colors.secondaryLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.barFill, { width: `${Math.max(ratio * 100, 5)}%` }]}
                      />
                    </View>
                    <Text style={[styles.barValue, { color: colors.secondary }]}>{val.toFixed(1)}</Text>
                  </View>
                );
              })}
            </GlassCard>
          </>
        )}

        {/* Common words */}
        {patterns.common_words.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('commonWords')}</Text>
            <GlassCard>
              <View style={styles.wordsWrap}>
                {patterns.common_words.slice(0, 15).map(([word, count], i) => (
                  <View key={word} style={[styles.wordChip, { opacity: 1 - i * 0.04 }]}>
                    <Text style={styles.wordText}>{word}</Text>
                    <Text style={styles.wordCount}>{count}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },

  periodRow: {
    flexDirection: 'row',
    gap: sp.sm,
    marginBottom: sp.lg,
  },
  periodBtn: {
    paddingHorizontal: sp.md,
    paddingVertical: sp.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgSoft,
  },
  periodBtnActive: { backgroundColor: colors.primarySoft },
  periodText:       { ...textStyles.label, color: colors.textMuted },
  periodTextActive: { color: colors.primary },

  sectionTitle: {
    ...textStyles.labelCaps,
    color: colors.textMuted,
    marginBottom: sp.sm,
    marginTop: sp.lg,
  },

  chartCard: { gap: sp.md },

  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.sm,
  },
  barLabel: {
    ...textStyles.bodySm,
    color: colors.textSecondary,
    width: 90,
    fontFamily: fonts.sansMedium,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgSoft,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  barValue: {
    ...textStyles.bodySm,
    fontFamily: fonts.sansBold,
    width: 32,
    textAlign: 'right',
  },

  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.sm,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: sp.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  wordText:  { ...textStyles.bodySm, color: colors.primary, fontFamily: fonts.sansMedium },
  wordCount: { ...textStyles.bodySm, color: colors.primaryLight, fontSize: 11 },
});
