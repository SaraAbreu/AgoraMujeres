import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Platform, ActivityIndicator, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../store/userStore';
import { useRouter } from 'expo-router';
import { GLUCOSA_URL } from '../constants';

const colorText   = '#5C3A1E';
const colorAccent = '#C5A059';
const colorSoft   = '#8B5A2B';
const colorMuted  = 'rgba(92,58,30,0.4)';

const BACKEND_URL = 'https://127.0.0.1:8001/api/glucosa';

export default function GlucosaScreen() {
  const router = useRouter();
  const token  = useUserStore((state) => state.token);
  const [value, setValue]         = useState('');
  const [date, setDate]           = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading]     = useState(false);

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

      useUserStore.getState().setLastGlucosa({
        valor: Number(value),
        fecha: date.toISOString(),
      });

      // Guardar en historial clínico del store
      useUserStore.getState().addHistorialEntry({
        tipo: 'glucosa',
        valor: Number(value),
        fecha: date.toISOString(),
        unidad: 'mg/dL',
      });

      Alert.alert('¡Guardado!', 'Tu registro de glucosa ha sido guardado.', [
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
    <View style={s.container}>
      <LinearGradient colors={['#FBF8F4', '#F2EBE0', '#E8D9C4']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* TOPBAR */}
        <View style={s.topbar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/(tabs)/home')} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={colorSoft} />
            <Text style={s.backText}>INICIO</Text>
          </TouchableOpacity>
        </View>

        {/* CARD */}
        <View style={s.card}>

          {/* Header */}
          <View style={s.cardHeader}>
            <View style={[s.iconCircle, { backgroundColor: colorAccent + '1A' }]}>
              <MaterialCommunityIcons name="water-outline" size={26} color={colorAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionLabel}>REGISTRO</Text>
              <Text style={s.title}>Glucosa</Text>
            </View>
          </View>

          {/* Input valor */}
          <Text style={s.label}>Valor en mg/dL</Text>
          <View style={s.inputWrapper}>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
              placeholder="ej. 95"
              placeholderTextColor={colorMuted}
            />
            <Text style={s.inputUnit}>mg/dL</Text>
          </View>

          {/* Selector fecha */}
          <Text style={s.label}>Fecha y hora</Text>
          <TouchableOpacity style={s.dateBtn} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={16} color={colorAccent} />
            <Text style={s.dateText}>{date.toLocaleString()}</Text>
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

          {/* Info */}
          <View style={s.infoBanner}>
            <Ionicons name="information-circle-outline" size={14} color={colorAccent} />
            <Text style={s.infoText}>Este registro se guardará también en tu historial clínico.</Text>
          </View>

          {/* Botón guardar */}
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#C5A059', '#8B5A2B']} style={s.saveBtnInner}>
              {loading
                ? <ActivityIndicator color="white" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                    <Text style={s.saveBtnText}>GUARDAR REGISTRO</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}



const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 60 },

  topbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(139,90,43,0.1)',
  },
  backText: { fontSize: 10, color: colorSoft, fontWeight: '700', letterSpacing: 2 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 32, padding: 26,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: colorSoft, shadowOpacity: 0.06,
    shadowRadius: 20, elevation: 3,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  iconCircle: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 8.5, color: colorMuted, letterSpacing: 4, fontWeight: '500', textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '200', color: colorSoft, letterSpacing: 3, textTransform: 'uppercase' },

  label: { fontSize: 9, color: colorMuted, letterSpacing: 3, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1, borderWidth: 1, borderColor: 'rgba(197,160,89,0.3)',
    borderRadius: 16, padding: 14, fontSize: 28,
    fontWeight: '200', color: colorSoft,
    backgroundColor: 'rgba(255,255,255,0.6)',
    letterSpacing: -1,
  },
  inputUnit: { fontSize: 11, color: colorMuted, fontWeight: '700', letterSpacing: 2 },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1, borderColor: 'rgba(197,160,89,0.3)',
    borderRadius: 16, padding: 14,
  },
  dateText: { fontSize: 14, color: colorSoft, fontWeight: '300' },

  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(197,160,89,0.07)',
    borderRadius: 14, padding: 12, marginTop: 24,
    borderWidth: 1, borderColor: 'rgba(197,160,89,0.14)',
  },
  infoText: { fontSize: 11, color: colorSoft, flex: 1, lineHeight: 16 },

  saveBtn: { marginTop: 24, borderRadius: 20, overflow: 'hidden' },
  saveBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 12, letterSpacing: 2.5 },
});