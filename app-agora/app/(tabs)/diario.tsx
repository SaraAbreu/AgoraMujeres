import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import api from '../../services/api';

interface DiarioEntry {
  id: string | number;
  date: string;
  text: string;
}

export default function DiarioScreen() {
  const router = useRouter();
  const [entry, setEntry] = useState('');
  const [history, setHistory] = useState<DiarioEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/diario');
      setHistory(res.data);
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    if (!entry.trim()) return;
    setLoading(true);
    try {
      await api.post('/api/diario', { texto: entry });
      setEntry('');
      await fetchHistory();
      Alert.alert("Guardado", "Tu reflexión está en la bóveda.");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#8B5A2B" /></TouchableOpacity>
          <Text style={styles.title}>Mi Diario</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.inputCard}>
          <Text style={styles.dateLabel}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <TextInput style={styles.input} multiline value={entry} onChangeText={setEntry} placeholder="¿Cómo te sientes?" placeholderTextColor="rgba(139, 90, 43, 0.4)" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={['#8B5A2B', '#C5A059']} style={styles.saveGradient}>
              <Text style={styles.saveText}>{loading ? "GUARDANDO..." : "GUARDAR REFLEXIÓN"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.sectionTitle}>MEMORIAS PASADAS</Text>
        {history.map((item, index) => (
          <Animated.View key={item.id || index} entering={FadeInUp.delay(400 + index * 100)} style={styles.historyCard}>
            <View style={styles.historyHeader}><Text style={styles.historyDate}>{item.date}</Text></View>
            <Text style={styles.historyText} numberOfLines={3}>{item.text}</Text>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 18, fontWeight: '200', color: '#8B5A2B', letterSpacing: 4, textTransform: 'uppercase' },
  inputCard: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 35, padding: 25, borderWidth: 1, borderColor: 'white', marginBottom: 40 },
  dateLabel: { fontSize: 11, fontWeight: '700', color: '#C5A059', marginBottom: 15, textTransform: 'uppercase' },
  input: { fontSize: 16, color: '#8B5A2B', minHeight: 150, textAlignVertical: 'top' },
  saveBtn: { marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  saveGradient: { paddingVertical: 15, alignItems: 'center' },
  saveText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#8B5A2B', opacity: 0.5, textAlign: 'center', marginBottom: 20 },
  historyCard: { backgroundColor: 'rgba(255,255,255,0.3)', padding: 20, borderRadius: 25, marginBottom: 15 },
  historyHeader: { marginBottom: 10 },
  historyDate: { fontSize: 11, fontWeight: 'bold', color: '#C5A059' },
  historyText: { fontSize: 14, color: '#8B5A2B', opacity: 0.8 }
});