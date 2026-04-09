import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';

const C = {
  forest:'#4A664D', forestDim:'#3A5140', forestDeep:'#2C3D2E',
  moss:'#6B8F6E', sage:'#A8C5A0',
  mint:'#D4E8D0', mintSoft:'#EAF4E8', cream:'#F8F7F2', parchment:'#F0EDE4',
  warm:'#E8E2D8', muted:'#9A958E', charcoal:'#3D3A35', white:'#FFFFFF', gold:'#C9A84C',
  diabetesAccent: '#5B8DB8',
  diabetesBg: '#EEF4FA',
};

const MOMENT_LABELS: Record<string, string> = {
  fasting: 'Ayunas',
  before_meal: 'Antes de comer',
  after_meal: 'Después de comer',
  night: 'Noche',
  other: 'Otro momento',
};

function getGlucoseColor(v: number) {
  if (v < 70) return '#C07A5A';
  if (v <= 100) return '#7BAF7E';
  if (v <= 140) return '#D4A96A';
  return '#C07A5A';
}

function getGlucoseLabel(v: number) {
  if (v < 70) return 'Hipoglucemia';
  if (v <= 100) return 'Normal';
  if (v <= 140) return 'Elevada';
  return 'Alta';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function EntryCard({ entry, onPress }: { entry: any; onPress: () => void }) {
  const glucoseColor = getGlucoseColor(entry.glucose);
  const glucoseLabel = getGlucoseLabel(entry.glucose);
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.cardDate}>{formatDate(entry.created_at)}</Text>
        <View style={[styles.glucosePill, { backgroundColor: glucoseColor + '22' }]}>
          <View style={[styles.glucoseDot, { backgroundColor: glucoseColor }]} />
          <Text style={[styles.glucosePillText, { color: glucoseColor }]}>
            {entry.glucose} mg/dL
          </Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color={C.muted} />
          <Text style={styles.metaText}>{MOMENT_LABELS[entry.moment] || entry.moment}</Text>
        </View>
        {entry.medication && (
          <View style={styles.metaItem}>
            <Ionicons name="medical-outline" size={13} color={C.muted} />
            <Text style={styles.metaText}>{entry.medication}</Text>
          </View>
        )}
      </View>
      {entry.symptoms?.length > 0 && (
        <View style={styles.tagsRow}>
          {entry.symptoms.slice(0, 3).map((s: string) => (
            <View key={s} style={styles.tag}>
              <Text style={styles.tagText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
      {entry.notes ? (
        <Text style={styles.cardText} numberOfLines={2}>{entry.notes}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function DiabetesList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId, userData } = useUserStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async (refresh = false) => {
    if (!deviceId) return;
    try {
      const res = await fetch(`${API_BASE}/diabetes?device_id=${deviceId}&limit=30`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { load(); }, [deviceId]);

  const exportPDF = async () => {
    if (Platform.OS !== 'web') return;
    setExporting(true);
    try {
      const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const name = userData?.name || '';
      const payload = {
        name,
        today,
        entries: entries.map((e: any) => ({
          date: new Date(e.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          glucose: e.glucose,
          moment: MOMENT_LABELS[e.moment] || e.moment,
          medication: e.medication || '',
          symptoms: e.symptoms || [],
          notes: e.notes || '',
        })),
      };
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/export/diabetes-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error generando PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agora-diabetes.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('PDF error:', e);
    } finally {
      setExporting(false);
    }
  };

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
            <Text style={styles.headerEyebrow}>Mi Salud</Text>
            <Text style={styles.headerTitle}>Glucosa y Bienestar</Text>
          </View>
          <TouchableOpacity onPress={exportPDF} style={[styles.addBtn, { marginRight: 8 }]} disabled={exporting}>
            {exporting ? <ActivityIndicator size="small" color={C.white} /> : <Ionicons name="download-outline" size={20} color={C.white} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/diabetes/new')} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={C.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={C.forest} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e, i) => e.id?.toString() || i.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefresh(true); load(true); }}
              tintColor={C.forest}
            />
          }
          renderItem={({ item }) => (
            <EntryCard entry={item} onPress={() => router.push(`/diabetes/${item.id}?entry=${encodeURIComponent(JSON.stringify(item))}`)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="pulse-outline" size={32} color={C.forest} />
              </View>
              <Text style={styles.emptyTitle}>Sin registros aún</Text>
              <Text style={styles.emptyText}>Empieza registrando tu glucosa de hoy.</Text>
              <TouchableOpacity onPress={() => router.push('/diabetes/new')} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Registrar ahora</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  list: { padding: 18, gap: 14 },
  card: {
    backgroundColor: C.white, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 12, color: C.moss, fontWeight: '600', textTransform: 'capitalize', flex: 1 },
  glucosePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
  },
  glucoseDot: { width: 6, height: 6, borderRadius: 3 },
  glucosePillText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: C.muted },
  cardText: {
    fontSize: 13, color: C.charcoal, lineHeight: 20,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: C.mintSoft, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  tagText: { fontSize: 12, color: C.moss, fontWeight: '500' },
  empty: { marginTop: 80, alignItems: 'center', gap: 14, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '300', color: C.charcoal,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyText: { fontSize: 14, color: C.muted, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 4, backgroundColor: C.forest,
    borderRadius: 100, paddingVertical: 12, paddingHorizontal: 28,
  },
  emptyBtnText: { color: C.white, fontWeight: '600', fontSize: 14 },
});
