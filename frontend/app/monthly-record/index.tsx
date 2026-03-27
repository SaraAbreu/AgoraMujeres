import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard, PremiumButton } from '../../src/components/ui';
import { useStore } from '../../src/store/useStore';
import { getMonthlyRecord, saveMonthlyRecord } from '../../src/services/api';
import { colors, textStyles, sp, radius, fonts } from '../../src/theme';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getMonthMatrix(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7;
  const totalDays = last.getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= totalDays; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
  return weeks;
}

/** Pain levels: 0 = none, 1-3 = mild, 4-6 = moderate, 7-10 = severe */
function painColor(level: number): string {
  if (level === 0) return 'transparent';
  if (level <= 3) return colors.accent;        // sage green
  if (level <= 6) return colors.secondary;     // rose gold
  return colors.error;                          // red
}

export default function MonthlyRecordScreen() {
  const { t }  = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useStore();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [painMap, setPainMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const monthName = new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weeks = getMonthMatrix(year, month);

  useFocusEffect(useCallback(() => {
    if (!deviceId) return;
    setLoading(true);
    getMonthlyRecord(deviceId)
      .then((data) => {
        if (data?.records) {
          const map: Record<string, number> = {};
          data.records.forEach((r) => { map[r.date] = r.intensity; });
          setPainMap(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceId]));

  const dayKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const cyclePain = (day: number) => {
    Haptics.selectionAsync();
    const key = dayKey(day);
    const current = painMap[key] || 0;
    const next = current >= 10 ? 0 : current + 1;
    setPainMap((prev) => ({ ...prev, [key]: next }));
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const handleSave = async () => {
    if (!deviceId) return;
    setSaving(true);
    try {
      const records = Object.entries(painMap)
        .filter(([_, v]) => v > 0)
        .map(([date, intensity]) => ({ date, intensity }));
      await saveMonthlyRecord(deviceId, {
        records,
        cycle_start_date: records.length > 0 ? records.sort((a, b) => a.date.localeCompare(b.date))[0].date : new Date().toISOString().slice(0, 10),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✨', t('recordSaved'));
    } catch {
      Alert.alert('Error', t('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('monthlyRecord')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthNameText}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <GlassCard style={styles.instrCard}>
          <Ionicons name="finger-print-outline" size={18} color={colors.primary} />
          <Text style={styles.instrText}>{t('monthlyRecordInstr')}</Text>
        </GlassCard>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: sp.xl }} />
        ) : (
          <GlassCard style={styles.calendar}>
            {/* Weekday header */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.weekLabel}>{d}</Text>
              ))}
            </View>

            {/* Days */}
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  const level = day ? (painMap[dayKey(day)] || 0) : 0;
                  return (
                    <TouchableOpacity
                      key={di}
                      style={[
                        styles.dayCell,
                        day != null && level > 0 && { backgroundColor: painColor(level) },
                      ]}
                      onPress={() => day && cyclePain(day)}
                      disabled={!day}
                      activeOpacity={0.6}
                    >
                      {day ? (
                        <View style={styles.dayCellInner}>
                          <Text style={[
                            styles.dayText,
                            level > 6 && { color: '#fff' },
                          ]}>
                            {day}
                          </Text>
                          {level > 0 && (
                            <Text style={[
                              styles.painLevel,
                              level > 6 && { color: 'rgba(255,255,255,0.8)' },
                            ]}>
                              {level}
                            </Text>
                          )}
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </GlassCard>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { label: t('noPain'),   color: 'transparent', border: true },
            { label: '1-3',         color: colors.accent },
            { label: '4-6',         color: colors.secondary },
            { label: '7-10',        color: colors.error },
          ].map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[
                styles.legendDot,
                { backgroundColor: item.color },
                item.border && { borderWidth: 1, borderColor: colors.borderLight },
              ]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <PremiumButton
          title={t('saveRecord')}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          size="lg"
          style={{ marginTop: sp.lg }}
        />

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const CELL = 44;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: sp.screenX, paddingVertical: sp.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...textStyles.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: sp.screenX, paddingBottom: 40 },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: sp.md,
  },
  monthNameText: { ...textStyles.subtitle, color: colors.textPrimary, textTransform: 'capitalize' },

  instrCard: { flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginBottom: sp.md },
  instrText: { ...textStyles.bodySm, color: colors.textSecondary, flex: 1 },

  calendar: { paddingHorizontal: sp.xxs, paddingVertical: sp.sm },
  weekRow:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  weekLabel: { ...textStyles.labelCaps, color: colors.textMuted, width: CELL, textAlign: 'center' },

  dayCell: {
    width: CELL, height: CELL,
    borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellInner: { alignItems: 'center' },
  dayText:   { ...textStyles.bodySm, color: colors.textPrimary, lineHeight: 16 },
  painLevel: { fontSize: 8, color: colors.textMuted, fontFamily: fonts.sansBold },

  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: sp.md,
    marginTop: sp.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 12, height: 12, borderRadius: 3 },
  legendLabel: { ...textStyles.bodySm, color: colors.textMuted },
});
