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
import { getCycleEntries, createCycleEntry, type CycleEntry } from '../../src/services/api';
import { colors, textStyles, sp, radius, fonts } from '../../src/theme';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getMonthMatrix(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7; // Monday = 0
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

export default function CycleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useStore();

  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const monthName = new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weeks = getMonthMatrix(year, month);

  useFocusEffect(useCallback(() => {
    if (!deviceId) return;
    setLoading(true);
    getCycleEntries(deviceId)
      .then((entries: CycleEntry[]) => {
        // Build a set of all dates between start_date and end_date for each entry
        const dates = new Set<string>();
        entries.forEach((e) => {
          dates.add(e.start_date);
          if (e.end_date) dates.add(e.end_date);
        });
        setSelected(dates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceId]));

  const toggleDate = (day: number) => {
    Haptics.selectionAsync();
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isSelected = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selected.has(key);
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const handleSave = async () => {
    if (!deviceId) return;
    setSaving(true);
    try {
      // Save each selected date as a cycle entry with start_date
      const dates = Array.from(selected).sort();
      if (dates.length > 0) {
        await createCycleEntry({
          device_id: deviceId,
          start_date: dates[0],
          end_date: dates[dates.length - 1],
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✨', t('cycleSaved'));
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
        <Text style={styles.headerTitle}>{t('cycleTracking')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthName}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

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
                {week.map((day, di) => (
                  <TouchableOpacity
                    key={di}
                    style={[styles.dayCell, day != null && isSelected(day) && styles.dayCellSelected]}
                    onPress={() => day && toggleDate(day)}
                    disabled={!day}
                    activeOpacity={0.6}
                  >
                    {day ? (
                      <Text style={[
                        styles.dayText,
                        isSelected(day) && styles.dayTextSelected,
                      ]}>
                        {day}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </GlassCard>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.legendText}>{t('periodDay')}</Text>
          </View>
        </View>

        {/* Info */}
        <GlassCard style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{t('cycleInfo')}</Text>
        </GlassCard>

        <PremiumButton
          title={t('saveCycle')}
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

const CELL = 40;

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
  monthName: { ...textStyles.subtitle, color: colors.textPrimary, textTransform: 'capitalize' },

  calendar: { paddingHorizontal: sp.xs, paddingVertical: sp.sm },
  weekRow:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  weekLabel: { ...textStyles.labelCaps, color: colors.textMuted, width: CELL, textAlign: 'center' },

  dayCell: {
    width: CELL, height: CELL,
    borderRadius: CELL / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellSelected: { backgroundColor: colors.secondary },
  dayText:         { ...textStyles.body, color: colors.textPrimary },
  dayTextSelected: { color: '#fff', fontFamily: fonts.sansBold },

  legend: { flexDirection: 'row', gap: sp.md, marginTop: sp.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...textStyles.bodySm, color: colors.textMuted },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: sp.sm, marginTop: sp.md },
  infoText: { ...textStyles.bodySm, color: colors.textSecondary, flex: 1 },
});
