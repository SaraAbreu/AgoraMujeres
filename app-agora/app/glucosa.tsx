
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUserStore } from '../store/userStore';
import { useRouter } from 'expo-router';
import { GLUCOSA_URL } from '../constants';

const colorText = '#8B5A2B';
const colorAccent = '#C5A059';

const BACKEND_URL = 'https://127.0.0.1:8001/api/glucosa'; // Cambia por tu endpoint real

export default function GlucosaScreen() {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!value || isNaN(Number(value))) {
      Alert.alert('Dato inválido', 'Introduce un valor numérico de glucosa.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          valor: Number(value),
          fecha: date.toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Error en el servidor');

      // --- PASO CLAVE: Actualizamos el Store con el nuevo dato ---
      useUserStore.getState().setLastGlucosa({
        valor: Number(value),
        fecha: date.toISOString(),
      });

      Alert.alert('¡Guardado!', 'Tu registro de glucosa ha sido guardado con éxito.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
      ]);

      setValue('');
      setDate(new Date());
      
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el registro. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F5F5DC', '#FFF8DC']} style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Registro de Glucosa</Text>
        <Text style={styles.label}>Valor</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={value}
          onChangeText={setValue}
        />
        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>{date.toLocaleString()}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(Platform.OS === 'ios');
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, color: colorText, fontWeight: 'bold', marginBottom: 30 },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    padding: 28,
    width: 320,
    shadowColor: colorAccent,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    alignItems: 'stretch',
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
  },
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