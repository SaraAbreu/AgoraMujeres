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
import { getDiaryEntries, type DiaryEntry } from '../../src/services/api';

const T = {
  forest:'#4A664D', forestDim:'#3A5140', moss:'#6B8F6E', sage:'#A8C5A0',
  mint:'#D4E8D0', mintSoft:'#EAF4E8', cream:'#F8F7F2', parchment:'#F0EDE4',
  muted:'#9A958E', charcoal:'#3D3A35', white:'#FFFFFF',
};

function getPainColor(v: number) {
  return v <= 3 ? '#7BAF7E' : v <= 6 ? '#D4A96A' : '#C07A5A';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' });
}

function EntryCard({ entry, onPress }: { entry: DiaryEntry & any; onPress: () => void }) {
  const tags = [...(entry.cuerpo || []), ...(entry.mente || []), ...(entry.alma || [])].slice(0, 3);
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.cardDate}>{formatDate(entry.created_at)}</Text>
        {entry.dolor > 0 && (
          <View style={[styles.painPill, { backgroundColor: getPainColor(entry.dolor) + '22' }]}>
            <View style={[styles.painDot, { backgroundColor: getPainColor(entry.dolor) }]} />
            <Text style={[styles.painPillText, { color: getPainColor(entry.dolor) }]}>
              {entry.dolor}/10
            </Text>
          </View>
        )}
      </View>

      {entry.texto ? (
        <Text style={styles.cardText} numberOfLines={3}>{entry.texto}</Text>
      ) : tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function DiaryList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useUserStore();
  const [entries, setEntries]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);

  const load = async (refresh = false) => {
    if (!deviceId) return;
    try {
      const data = await getDiaryEntries(deviceId, 30);
      setEntries(data);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { load(); }, [deviceId]);

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      {/* Header */}
      <LinearGradient
        colors={[T.forestDim, T.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>Mi Refugio</Text>
            <Text style={styles.headerTitle}>Diario de Alivio</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/diary/new')} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={T.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={T.forest} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefresh(true); load(true); }}
              tintColor={T.forest}
            />
          }
          renderItem={({ item }) => <EntryCard entry={item} onPress={() => {}} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>Tu refugio espera</Text>
              <Text style={styles.emptyText}>Empieza registrando cómo te sientes hoy.</Text>
              <TouchableOpacity onPress={() => router.push('/diary/new')} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Escribir ahora</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerEyebrow: { color: T.sage, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { color: T.white, fontSize: 26, fontWeight: '800' },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: T.white, borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardDate: { fontSize: 12, color: T.moss, fontWeight: '600', textTransform: 'capitalize', flex: 1 },
  cardText: { fontSize: 14, color: T.charcoal, lineHeight: 22, fontStyle: 'italic' },
  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:      { backgroundColor: T.mintSoft, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  tagText:  { fontSize: 12, color: T.moss, fontWeight: '500' },
  painPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  painDot:  { width: 6, height: 6, borderRadius: 3 },
  painPillText: { fontSize: 11, fontWeight: '700' },
  empty: { marginTop: 80, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: T.charcoal },
  emptyText:  { fontSize: 14, color: T.muted, fontStyle: 'italic' },
  emptyBtn: { marginTop: 8, backgroundColor: T.forest, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 28 },
  emptyBtnText: { color: T.white, fontWeight: '700', fontSize: 14 },
});