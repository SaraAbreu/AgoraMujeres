import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView } from 'react-native';
import { useStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';
import { useRouter } from 'expo-router';

export default function NewDiaryEntry() {
  const { deviceId } = useStore();
  const router = useRouter();
  const [texto, setTexto] = useState('');

  const saveEntry = async () => {
    const entry = {
      device_id: deviceId,
      texto,
      emotional_state: {
        calma: 0,
        fatiga: 0,
        niebla_mental: 0,
        dolor_difuso: 0,
        gratitud: 0,
        tension: 0,
      },
      physical_state: {
        nivel_dolor: 0,
        energia: 0,
        sensibilidad: 0,
      },
      weather: { additionalProp1: {} }
    };

    const res = await fetch(`${API_BASE}/diary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      Alert.alert('Error', 'No se pudo guardar la entrada.');
      return;
    }

    Alert.alert('Guardado', 'Tu entrada del diario se ha guardado.');
    router.back(); // vuelve a la lista
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Nueva entrada</Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 8,
          minHeight: 120,
        }}
        multiline
        value={texto}
        onChangeText={setTexto}
        placeholder="Escribe aquí tu entrada del día..."
      />

      <Button title="Guardar" onPress={saveEntry} />
    </ScrollView>
  );
}
