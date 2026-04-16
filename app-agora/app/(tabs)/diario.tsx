import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DiarioScreen() {
  const router = useRouter();
  const [entry, setEntry] = useState('');

  // Ejemplo de entradas anteriores
  const [history, setHistory] = useState([
    { id: 1, date: '12 Abr', text: 'Hoy me he sentido con más energía, el dolor lumbar ha bajado...' },
    { id: 2, date: '10 Abr', text: 'Sesión de reflexión con Ágora muy reveladora sobre mi estrés.' },
  ]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#8B5A2B" />
          </TouchableOpacity>
          <Text style={styles.title}>Mi Diario</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {/* INPUT DE NUEVA ENTRADA */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.inputCard}>
          <Text style={styles.dateLabel}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <TextInput
            style={styles.input}
            placeholder="¿Cómo te sientes en este momento? Desahoga tu mente..."
            placeholderTextColor="rgba(139, 90, 43, 0.4)"
            multiline
            value={entry}
            onChangeText={setEntry}
          />
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
            <LinearGradient colors={['#8B5A2B', '#C5A059']} style={styles.saveGradient}>
              <Text style={styles.saveText}>GUARDAR REFLEXIÓN</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* HISTORIAL DE ENTRADAS */}
        <Text style={styles.sectionTitle}>MEMORIAS PASADAS</Text>
        
        {history.map((item, index) => (
          <Animated.View 
            key={item.id} 
            entering={FadeInUp.delay(400 + index * 100)} 
            style={styles.historyCard}
          >
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Ionicons name="ellipsis-horizontal" size={16} color="#8B5A2B" opacity={0.5} />
            </View>
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
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '200', color: '#8B5A2B', letterSpacing: 4, textTransform: 'uppercase' },
  
  inputCard: { 
    backgroundColor: 'rgba(255,255,255,0.5)', 
    borderRadius: 35, 
    padding: 25, 
    borderWidth: 1, 
    borderColor: 'white',
    marginBottom: 40,
    elevation: 2,
    shadowColor: '#8B5A2B', shadowOpacity: 0.05, shadowRadius: 15
  },
  dateLabel: { fontSize: 11, fontWeight: '700', color: '#C5A059', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  input: { fontSize: 16, color: '#8B5A2B', lineHeight: 24, minHeight: 150, textAlignVertical: 'top', fontWeight: '300' },
  
  saveBtn: { marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  saveGradient: { paddingVertical: 15, alignItems: 'center' },
  saveText: { color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },

  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#8B5A2B', opacity: 0.5, letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  
  historyCard: { 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    padding: 20, 
    borderRadius: 25, 
    marginBottom: 15, 
    borderWidth: 0.5, 
    borderColor: 'rgba(255,255,255,0.6)' 
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  historyDate: { fontSize: 11, fontWeight: 'bold', color: '#C5A059' },
  historyText: { fontSize: 14, color: '#8B5A2B', lineHeight: 20, fontWeight: '300', opacity: 0.8 }
});