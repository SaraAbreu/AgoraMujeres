
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Switch, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUserStore } from '../store/userStore';
import { useRouter } from 'expo-router';
import { CICLO_URL, SINTOMAS_CICLO } from '../constants/ciclo';

const colorText = '#8B5A2B';
const colorAccent = '#C5A059';

export default function CicloScreen() {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const [inicio, setInicio] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [duracion, setDuracion] = useState('');
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [menopausia, setMenopausia] = useState(false);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSintoma = (s: string) => {
    setSintomas((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSave = async () => {
    if (!duracion || isNaN(Number(duracion))) {
      Alert.alert('Dato inválido', 'Introduce la duración del ciclo en días.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(CICLO_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          inicio: inicio.toISOString(),
          duracion: Number(duracion),
          sintomas,
          menopausia,
          notas,
        }),
      });

      if (!res.ok) throw new Error('Error en el servidor');

      // --- PASO CLAVE: Actualizamos el Store con los datos del ciclo ---
      useUserStore.getState().setLastCiclo({
        inicio: inicio.toISOString(),
        duracion: Number(duracion),
        sintomas: sintomas,
        fechaRegistro: new Date().toISOString()
      });

      Alert.alert('¡Guardado!', 'Tu registro de ciclo ha sido guardado con éxito.', [
        { 
          text: 'OK', 
          onPress: () => router.replace('/(tabs)/home') 
        }
      ]);

      // Limpiamos los campos
      setDuracion(''); 
      setSintomas([]); 
      setMenopausia(false); 
      setNotas(''); 
      setInicio(new Date());

    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el registro. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Registro de Ciclo Hormonal</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Fecha de inicio</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
            <Text style={styles.dateText}>{inicio.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={inicio}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setInicio(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Duración del ciclo (días)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={duracion}
            onChangeText={setDuracion}
            placeholder="Ej: 28"
            placeholderTextColor="#C5A2B988"
          />

          <Text style={styles.label}>Síntomas</Text>
          <View style={styles.sintomasRow}>
            {SINTOMAS_CICLO.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sintomaChip, sintomas.includes(s) && styles.sintomaChipActive]}
                onPress={() => toggleSintoma(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sintomaText, sintomas.includes(s) && styles.sintomaTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>¿Menopausia?</Text>
            <Switch value={menopausia} onValueChange={setMenopausia} trackColor={{ true: colorAccent, false: '#ccc' }} />
          </View>

          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={notas}
            onChangeText={setNotas}
            placeholder="Observaciones, detalles..."
            placeholderTextColor="#C5A2B988"
            multiline
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar registro</Text>
            )}
          </TouchableOpacity>

          {/* Botón volver a home */}
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')} activeOpacity={0.8}>
            <Text style={styles.homeBtnText}>
              <Text style={{fontSize:18}}>←</Text> Volver a inicio
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingVertical: 60 },
  title: { fontSize: 24, color: colorText, fontWeight: 'bold', marginBottom: 30, alignSelf: 'center' },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    padding: 28,
    width: 340,
    shadowColor: colorAccent,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    alignSelf: 'center',
    marginBottom: 40,
  },
  label: { color: colorText, fontWeight: 'bold', marginBottom: 6, marginTop: 18 },
  input: {
    borderWidth: 1,
    borderColor: colorAccent,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    color: colorText,
    backgroundColor: 'white',
    marginBottom: 2,
  },
  sintomasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  sintomaChip: {
    borderWidth: 1,
    borderColor: colorAccent,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 6,
    backgroundColor: 'white',
  },
  sintomaChipActive: { backgroundColor: colorAccent },
  sintomaText: { color: colorText, fontSize: 13 },
  sintomaTextActive: { color: 'white', fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  saveBtn: {
    marginTop: 28,
    backgroundColor: colorAccent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colorAccent,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  homeBtn: {
    marginTop: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(197,160,89,0.08)',
  },
  homeBtnText: {
    color: colorText,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  dateBtn: {
  backgroundColor: 'white',
  borderWidth: 1,
  borderColor: colorAccent,
  borderRadius: 12,
  padding: 12,
  marginBottom: 10,
  alignItems: 'center',
},
dateText: {
  fontSize: 16,
  color: colorText,
},
});