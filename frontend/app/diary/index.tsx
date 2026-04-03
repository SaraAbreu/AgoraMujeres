import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';

interface DiaryEntry {
  id: number;
  created_at: string;
  texto: string;
  physical_state: number;
}

export default function DiaryList() {
  const router = useRouter();
  const { userToken } = useUserStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = async () => {
    try {
      const res = await fetch(`${API_BASE}/diary?user_token=${userToken}`);
      const data = await res.json();
      if (res.ok) {
        // Ordenamos por fecha para que la más reciente salga arriba
        setEntries(data.sort((a: { id: number; }, b: { id: number; }) => b.id - a.id));
      }
    } catch (e) {
      console.error("Error cargando diario:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userToken) fetchEntries();
  }, [userToken]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/home')}><Ionicons name="home-outline" size={24} color="#4A664D" /></TouchableOpacity>
        <Text style={styles.title}>Mi Refugio</Text>
        <TouchableOpacity onPress={() => router.push('/diary/new')}><Ionicons name="add-circle" size={32} color="#4A664D" /></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A664D" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchEntries();}} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</Text>
                {item.physical_state > 0 && (
                  <View style={styles.painBadge}><Text style={styles.painText}>Dolor: {item.physical_state}</Text></View>
                )}
              </View>
              <Text style={styles.text}>{item.texto}</Text>
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
  card: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EAE8E0', shadowColor: '#4A664D', shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  date: { fontSize: 13, color: '#7A8E7A', fontWeight: '600' },
  painBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  painText: { fontSize: 11, color: '#EF4444', fontWeight: 'bold' },
  text: { color: '#4A664D', lineHeight: 22, fontSize: 15 },
  emptyContainer: { marginTop: 100, alignItems: 'center', padding: 40 },
  emptyText: { textAlign: 'center', color: '#A0AFA0', fontStyle: 'italic', fontSize: 16 }
});