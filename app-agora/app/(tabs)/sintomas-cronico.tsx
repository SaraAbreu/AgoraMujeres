import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { registrarSintomasCronico } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics'; 

const { width } = Dimensions.get('window');

const SINTOMAS_CATEGORIZADOS = [
  { 
    categoria: 'Sensaciones Físicas', 
    icon: 'leaf-outline',
    items: [
      { key: 'dolor_lumbar', label: 'Tensión Lumbar' },
      { key: 'hinchazon', label: 'Inflamación Abdominal' },
      { key: 'fatiga', label: 'Cansancio Profundo' },
      { key: 'dolor_pelvico', label: 'Molestia Pélvica' },
    ]
  },
  { 
    categoria: 'Estado de Ánimo', 
    icon: 'heart-outline',
    items: [
      { key: 'irritabilidad', label: 'Sensibilidad Alta' },
      { key: 'ansiedad', label: 'Inquietud' },
      { key: 'animo_bajo', label: 'Ánimo Calmo' },
    ]
  }
];

export default function SintomasCronicoScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSintoma = async (key: string) => {
    // Feedback táctil con seguridad para que no rompa la app
    try {
      if (Platform.OS !== 'web' && Haptics.impactAsync) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.log("Haptics no disponibles");
    }
    
    setSintomas((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (sintomas.length === 0) {
      Alert.alert('Tu santuario', 'Por favor, selecciona al menos una sensación para registrar.');
      return;
    }

    setLoading(true);
    try {
      await registrarSintomasCronico({
        device_id: user?.email || 'anonymous', 
        sintomas: sintomas,
        zona: 'General',
        notas: notas
      });

      try {
        if (Platform.OS !== 'web' && Haptics.notificationAsync) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {}
      
      Alert.alert('Registro Guardado', 'Tu cuerpo te agradece por escucharlo.', [
        { text: 'Finalizar', onPress: () => router.replace('/(tabs)/home') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No pudimos conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#8B5A2B" />            
          </TouchableOpacity>
          <Text style={styles.title}>Mi Estado Actual</Text>
          <Text style={styles.subtitle}>Escucha lo que tu cuerpo intenta decirte hoy</Text>
        </Animated.View>

        {SINTOMAS_CATEGORIZADOS.map((cat, catIdx) => (
          <Animated.View 
            key={cat.categoria} 
            entering={FadeInRight.delay(200 * catIdx)}
            style={styles.categorySection}
          >
            <View style={styles.categoryTitleRow}>
              <Ionicons name={cat.icon as any} size={18} color="#C5A059" />
              <Text style={styles.categoryTitle}>{cat.categoria}</Text>
            </View>

            <View style={styles.chipsContainer}>
              {cat.items.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.7}
                  style={[
                    styles.chip, 
                    sintomas.includes(item.key) && styles.chipActive
                  ]}
                  onPress={() => toggleSintoma(item.key)}
                >
                  <Text style={[
                    styles.chipText, 
                    sintomas.includes(item.key) && styles.chipTextActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(600)} style={styles.notesSection}>
          <Text style={styles.label}>Observaciones adicionales</Text>
          <TextInput
            style={styles.input}
            placeholder="¿Hay algo más que quieras recordar?"
            placeholderTextColor="#C5A059"
            multiline
            value={notas}
            onChangeText={setNotas}
          />
        </Animated.View>

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <LinearGradient colors={['#8B5A2B', '#704923']} style={styles.gradientBtn}>
              <Text style={styles.saveBtnText}>Guardar en mi Bitácora</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContainer: { padding: 25, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 30, alignItems: 'center' },
  backBtn: { position: 'absolute', left: 0, top: 0, padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#8B5A2B' },
  subtitle: { fontSize: 14, color: '#C5A059', marginTop: 5, textAlign: 'center' },
  categorySection: { marginBottom: 25 },
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  categoryTitle: { fontSize: 12, fontWeight: 'bold', color: '#C5A059', letterSpacing: 1 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { 
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, 
    borderRadius: 20, borderWidth: 1, borderColor: '#EADBC8' 
  },
  chipActive: { backgroundColor: '#8B5A2B', borderColor: '#8B5A2B' },
  chipText: { color: '#8B5A2B', fontSize: 14 },
  chipTextActive: { color: 'white', fontWeight: 'bold' },
  notesSection: { marginBottom: 30 },
  label: { fontSize: 15, fontWeight: '600', color: '#8B5A2B', marginBottom: 10 },
  input: { 
    backgroundColor: 'white', borderRadius: 20, padding: 15, height: 100, 
    textAlignVertical: 'top', borderWidth: 1, borderColor: '#EADBC8', color: '#8B5A2B' 
  },
  saveBtn: { borderRadius: 25, overflow: 'hidden', elevation: 4 },
  gradientBtn: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});