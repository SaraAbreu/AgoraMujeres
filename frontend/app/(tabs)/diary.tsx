import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer, GlassCard, EmptyState } from '../../src/components/ui';
import { useStore } from '../../src/store/useStore';
import { getDiaryEntries, type DiaryEntry } from '../../src/services/api';
import { colors, textStyles, sp, radius, fonts } from '../../src/theme';

const EMOTION_EMOJI: Record<string, string> = {
  calma: '😌', fatiga: '😴', niebla_mental: '🌫️',
  dolor_difuso: '💔', gratitud: '🙏', tension: '😤',
};

export default function DiaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId } = useStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!deviceId) return;
    try { setEntries(await getDiaryEntries(deviceId, 50)); } catch { /* noop */ }
  };

  useEffect(() => { load(); }, [deviceId]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderEntry = ({ item }: { item: DiaryEntry }) => {
    const emotions = Object.entries(item.emotional_state || {})
      .filter(([, v]) => typeof v === 'number' && v > 0)
      .sort(([, a], [, b]) => (b as number) - (a as number));
    const date = new Date(item.created_at);

    return (
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateDay}>{date.getDate()}</Text>
            <Text style={styles.dateMonth}>
              {date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
            </Text>
          </View>
          <View style={styles.emotionPills}>
            {emotions.slice(0, 3).map(([key, val]) => (
              <View key={key} style={[styles.pill, { backgroundColor: (colors.emotion as any)[key] + '20' }]}>
                <Text style={styles.pillEmoji}>{EMOTION_EMOJI[key] || '•'}</Text>
                <Text style={[styles.pillText, { color: (colors.emotion as any)[key] || colors.primary }]}>
                  {t(key)} {val}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {item.texto && (
          <Text style={styles.entryText} numberOfLines={3}>{item.texto}</Text>
        )}
        {item.physical_state && (
          <View style={styles.physicalRow}>
            <Ionicons name="fitness-outline" size={14} color={colors.textMuted} />
            <Text style={styles.physicalText}>
              {t('nivel_dolor')}: {item.physical_state.nivel_dolor}/10  ·  {t('energia')}: {item.physical_state.energia}/10
            </Text>
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <ScreenContainer
      title={t('diary')}
      headerRight={
        <TouchableOpacity onPress={() => router.push('/diary/new')} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      }
    >
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={renderEntry}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState icon="book-outline" title={t('noEntries')} message={t('startWriting')} />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list:      { paddingBottom: 100, gap: sp.sm },
  emptyList: { flex: 1 },
  addBtn: {
    width: 40, height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card:       { marginBottom: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: sp.md, marginBottom: sp.sm },
  dateDay:    { ...textStyles.h1, color: colors.primary, lineHeight: 34 },
  dateMonth:  { ...textStyles.labelCaps, color: colors.textMuted, fontSize: 10 },
  emotionPills: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  pillEmoji: { fontSize: 12 },
  pillText:  { ...textStyles.bodySm, fontFamily: fonts.sansMedium },
  entryText: {
    ...textStyles.body,
    color: colors.textPrimary,
    marginBottom: sp.xs,
  },
  physicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: sp.xs,
    paddingTop: sp.xs,
    borderTopWidth: 1,
    borderTopColor: colors.textMuted,
  },
  physicalText: { ...textStyles.bodySm, color: colors.textMuted },
});
