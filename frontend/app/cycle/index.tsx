import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';

interface DiaryEntry {
  id: string;
  created_at: string;
  texto: string;
  dolor: number;
  tags: string[];
}

export default function DiaryList() {
  const router = useRouter();
  const { deviceId } = useUserStore(); // ✅ Usamos deviceId
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = async () => {
    if (!deviceId) return;
    try {
      const res = await fetch(`${API_BASE}/diary/${deviceId}`); // ✅ Ruta corregida
      const data = await res.json();
      if (res.ok) {
        setEntries(data);
      }
    } catch (e) {
      console.error("Error cargando diario:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchEntries(); }, [deviceId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Diario</Text>
        <TouchableOpacity onPress={() => router.push('/diary/new')}>
          <Ionicons name="add-circle" size={32} color="#4A664D" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A664D" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchEntries} />}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <View style={styles.painBadge}>
                   <Text style={styles.painText}>Dolor: {item.dolor}</Text>
                </View>
              </View>
              <Text style={styles.text}>{item.texto}</Text>
              <View style={styles.tagContainer}>
                {item.tags?.map((tag, i) => (
                  <View key={i} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tu refugio está esperando tu primera palabra...</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EAE8E0' },
  title: { fontSize: 20, fontWeight: '700', color: '#4A664D' },
  card: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EAE8E0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { fontSize: 13, color: '#7A8E7A', fontWeight: '600' },
  painBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  painText: { color: '#B91C1C', fontSize: 12, fontWeight: 'bold' },
  text: { fontSize: 15, color: '#4A4A4A', lineHeight: 22, marginBottom: 10 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagBadge: { backgroundColor: '#F0F4F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8E2' },
  tagText: { fontSize: 11, color: '#4A664D' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#A0A0A0', textAlign: 'center' }
});