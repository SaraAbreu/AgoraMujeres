import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/useStore';
import { getPatterns, type Patterns } from '../../src/services/api';

const C = {
  forest: '#4A664D', forestDim: '#3A5140', forestDeep: '#2C3D2E',
  moss: '#6B8F6E', sage: '#A8C5A0',
  mint: '#D4E8D0', mintSoft: '#EAF4E8', cream: '#F8F7F2', parchment: '#F0EDE4',
  warm: '#E8E2D8', muted: '#9A958E', charcoal: '#3D3A35', white: '#FFFFFF',
  amber: '#D4A96A', rose: '#C07A5A',
};

function getPainColor(v: number) {
  return v <= 3 ? '#7BAF7E' : v <= 6 ? '#D4A96A' : '#C07A5A';
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max((value / max) * 100, 4);
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const EMOTION_LABELS: Record<string, string> = {
  calma: 'Calma', fatiga: 'Fatiga', niebla_mental: 'Niebla mental',
  dolor_difuso: 'Dolor difuso', gratitud: 'Gratitud', tension: 'Tensión',
};

const EMOTION_COLORS: Record<string, string> = {
  calma: '#7BAF7E', fatiga: '#C07A5A', niebla_mental: '#8E9BAD',
  dolor_difuso: '#C07A5A', gratitud: '#A8B89A', tension: '#B09BB0',
};

export default function PatternsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deviceId } = useUserStore();
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!deviceId) return;
    try {
      const data = await getPatterns(deviceId, days);
      setPatterns(data);
    } catch {
      setPatterns(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { setLoading(true); load(); }, [deviceId, days]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const emotionEntries = Object.entries(patterns?.emotional_averages || {})
    .filter(([, v]) => typeof v === 'number' && (v as number) > 0)
    .sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <LinearGradient
        colors={[C.forestDeep, C.forest]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.mint} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Mi Refugio</Text>
            <Text style={styles.headerTitle}>Mis Patrones</Text>
          </View>
          <View style={styles.periodRow}>
            {[7, 30].map(d => (
              <TouchableOpacity
                key={d}
                onPress={() => setDays(d)}
                style={[styles.periodBtn, days === d && styles.periodBtnActive]}
              >
                <Text style={[styles.periodText, days === d && styles.periodTextActive]}>
                  {d === 7 ? '7 días' : '30 días'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {patterns && (
          <Text style={styles.headerSub}>
            {patterns.total_entries} entradas · últimos {days} días
          </Text>
        )}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={C.forest} style={{ marginTop: 60 }} />
      ) : !patterns || patterns.total_entries === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="analytics-outline" size={32} color={C.forest} />
          </View>
          <Text style={styles.emptyTitle}>Aún no hay patrones</Text>
          <Text style={styles.emptyText}>
            Registra cómo te sientes cada día y aquí verás tus tendencias.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.forest} />
          }
        >
          {patterns.physical_averages && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Dolor promedio</Text>
              <View style={styles.painSummary}>
                <View style={[styles.painIconBox, { backgroundColor: getPainColor(patterns.physical_averages?.nivel_dolor) + '22' }]}>
                  <Ionicons name="pulse-outline" size={24} color={getPainColor(patterns.physical_averages?.nivel_dolor)} />
                </View>
                <View>
                  <Text style={[styles.painBig, { color: getPainColor(patterns.physical_averages?.nivel_dolor) }]}>
                    {patterns.physical_averages?.nivel_dolor.toFixed(1)}
                  </Text>
                  <Text style={styles.painOf}>/ 10</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <BarRow label="Dolor" value={patterns.physical_averages?.nivel_dolor} max={10} color={getPainColor(patterns.physical_averages?.nivel_dolor)} />
                  <BarRow label="Energía" value={patterns.physical_averages?.energia} max={10} color={C.moss} />
                  <BarRow label="Sensib." value={patterns.physical_averages?.sensibilidad} max={10} color={C.amber} />
                </View>
              </View>
            </View>
          )}

          {emotionEntries.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Tendencias emocionales</Text>
              <View style={styles.barsWrap}>
                {emotionEntries.map(([key, val]) => (
                  <BarRow key={key} label={EMOTION_LABELS[key] || key} value={val as number} max={5} color={EMOTION_COLORS[key] || C.moss} />
                ))}
              </View>
            </View>
          )}

          {patterns.common_words?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Lo que más aparece</Text>
              <View style={styles.wordsWrap}>
                {patterns.common_words.slice(0, 15).map(([word, count], i) => (
                  <View key={word} style={[styles.wordChip, { opacity: Math.max(1 - i * 0.05, 0.5) }]}>
                    <Text style={styles.wordText}>{word}</Text>
                    <Text style={styles.wordCount}>{count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {patterns.trends && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Destacados</Text>
              <View style={styles.trendRow}>
                <View style={[styles.trendChip, { backgroundColor: C.mintSoft }]}>
                  <Ionicons name="trending-up" size={16} color={C.moss} />
                  <Text style={[styles.trendText, { color: C.moss }]}>
                    Más alta: {EMOTION_LABELS[patterns.trends.highest_emotional] || patterns.trends.highest_emotional}
                  </Text>
                </View>
                <View style={[styles.trendChip, { backgroundColor: '#FFF0EC' }]}>
                  <Ionicons name="trending-down" size={16} color={C.rose} />
                  <Text style={[styles.trendText, { color: C.rose }]}>
                    Más baja: {EMOTION_LABELS[patterns.trends.lowest_emotional] || patterns.trends.lowest_emotional}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  headerEyebrow: {
    color: C.sage, fontSize: 11, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 4, opacity: 0.8,
  },
  headerTitle: {
    color: C.white, fontSize: 26, fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.3,
  },
  headerSub: { color: C.sage, fontSize: 12, fontStyle: 'italic', marginTop: 10, opacity: 0.8 },
  periodRow: { flexDirection: 'row', gap: 6 },
  periodBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  periodBtnActive: { backgroundColor: 'rgba(255,255,255,0.28)', borderColor: 'rgba(255,255,255,0.3)' },
  periodText: { fontSize: 12, color: C.sage, fontWeight: '500' },
  periodTextActive: { color: C.white, fontWeight: '600' },

  scroll: { paddingHorizontal: 18, paddingTop: 20, gap: 14 },

  card: {
    backgroundColor: C.white, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 16,
  },

  painSummary: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  painIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  painBig: { fontSize: 34, fontWeight: '700' },
  painOf: { fontSize: 12, color: C.muted },

  barsWrap: { gap: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  barLabel: { fontSize: 12, color: C.muted, width: 80 },
  barTrack: { flex: 1, height: 6, borderRadius: 100, backgroundColor: C.parchment, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 100 },
  barValue: { fontSize: 12, fontWeight: '700', width: 30, textAlign: 'right' },

  wordsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.mintSoft, borderRadius: 100,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  wordText: { fontSize: 12, color: C.moss, fontWeight: '500' },
  wordCount: { fontSize: 11, color: C.moss, opacity: 0.7 },

  trendRow: { gap: 10 },
  trendChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 16,
  },
  trendText: { fontSize: 13, fontWeight: '600' },

  empty: { marginTop: 80, alignItems: 'center', gap: 14, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '300', color: C.charcoal,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyText: { fontSize: 14, color: C.muted, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
});
