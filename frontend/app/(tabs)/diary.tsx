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

const C = {
  forest:'#4A664D', forestDim:'#3A5140', forestDeep:'#2C3D2E',
  moss:'#6B8F6E', sage:'#A8C5A0',
  mint:'#D4E8D0', mintSoft:'#EAF4E8', cream:'#F8F7F2', parchment:'#F0EDE4',
  warm:'#E8E2D8', muted:'#9A958E', charcoal:'#3D3A35', white:'#FFFFFF', gold:'#C9A84C',
};

function getPainColor(v: number) {
  return v <= 3 ? '#7BAF7E' : v <= 6 ? '#D4A96A' : '#C07A5A';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
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
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);

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
            <Text style={styles.headerTitle}>Diario de Alivio</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/diary/new')} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={C.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={C.forest} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefresh(true); load(true); }}
              tintColor={C.forest}
            />
          }
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => router.push(`/diary/${item.id}?entry=${encodeURIComponent(JSON.stringify(item))}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="book-outline" size={32} color={C.forest} />
              </View>
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
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardDate: {
    fontSize: 12, color: C.moss, fontWeight: '600',
    textTransform: 'capitalize', flex: 1,
  },
  cardText: {
    fontSize: 14, color: C.charcoal, lineHeight: 24,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: C.mintSoft, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  tagText: { fontSize: 12, color: C.moss, fontWeight: '500' },
  painPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
  },
  painDot: { width: 6, height: 6, borderRadius: 3 },
  painPillText: { fontSize: 11, fontWeight: '700' },

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
  emptyBtn: {
    marginTop: 4, backgroundColor: C.forest,
    borderRadius: 100, paddingVertical: 12, paddingHorizontal: 28,
  },
  emptyBtnText: { color: C.white, fontWeight: '600', fontSize: 14 },
});
