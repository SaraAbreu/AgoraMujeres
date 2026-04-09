import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';

const C = {
  forest: '#4A664D', forestDim: '#3A5140', forestDeep: '#2C3D2E',
  moss: '#6B8F6E', sage: '#A8C5A0',
  mint: '#D4E8D0', mintSoft: '#EAF4E8', cream: '#F8F7F2', parchment: '#F0EDE4',
  warm: '#E8E2D8', warmGray: '#C8C3B8', charcoal: '#3D3A35', muted: '#9A958E',
  white: '#FFFFFF', gold: '#C9A84C',
};

const MOMENTS = [
  { key: 'fasting',      label: 'Ayunas',              icon: 'sunny-outline' },
  { key: 'before_meal',  label: 'Antes de comer',       icon: 'restaurant-outline' },
  { key: 'after_meal',   label: 'Después de comer',     icon: 'checkmark-circle-outline' },
  { key: 'night',        label: 'Noche',                icon: 'moon-outline' },
  { key: 'other',        label: 'Otro momento',         icon: 'ellipsis-horizontal-outline' },
];

const SYMPTOMS = [
  'Mareos', 'Temblores', 'Sudoración', 'Visión borrosa',
  'Fatiga', 'Hambre intensa', 'Irritabilidad', 'Dolor de cabeza',
  'Hormigueo', 'Náuseas', 'Palpitaciones', 'Sed excesiva',
];

function Chip({ label, selected, onPress, accent }: any) {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      <TouchableOpacity
        onPress={() => {
          Animated.sequence([
            Animated.timing(sc, { toValue: 0.92, duration: 70, useNativeDriver: true }),
            Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: true }),
          ]).start();
          onPress();
        }}
        activeOpacity={0.85}
      >
        <View style={[styles.chip, {
          borderColor: selected ? accent : C.warm,
          backgroundColor: selected ? accent + '22' : C.cream,
        }]}>
          <Text style={[styles.chipText, selected && { color: accent, fontWeight: '600' }]}>{label}</Text>
          {selected && <View style={[styles.chipDot, { backgroundColor: accent }]} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function GlucoseInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const numVal = parseInt(value) || 0;
  const color = numVal < 70 ? '#C07A5A' : numVal <= 100 ? '#7BAF7E' : numVal <= 140 ? '#D4A96A' : '#C07A5A';
  const label = numVal === 0 ? '—' : numVal < 70 ? 'Hipoglucemia' : numVal <= 100 ? 'Normal' : numVal <= 140 ? 'Elevada' : 'Alta';

  return (
    <View style={styles.glucoseWrap}>
      <View style={styles.glucoseRow}>
        <TextInput
          style={[styles.glucoseInput, { color }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="000"
          placeholderTextColor={C.warmGray}
          maxLength={3}
        />
        <Text style={styles.glucoseUnit}>mg/dL</Text>
        {numVal > 0 && (
          <View style={[styles.glucoseLabel, { backgroundColor: color + '18', borderColor: color + '40' }]}>
            <View style={[styles.glucoseDot, { backgroundColor: color }]} />
            <Text style={[styles.glucoseLabelText, { color }]}>{label}</Text>
          </View>
        )}
      </View>
      <Text style={styles.glucoseHint}>Normal en ayunas: 70–100 · Después de comer: hasta 140</Text>
    </View>
  );
}

export default function NewDiabetesEntry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useUserStore();

  const [glucose, setGlucose] = useState('');
  const [moment, setMoment] = useState('fasting');
  const [medication, setMedication] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleSymptom = (s: string) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSave = async () => {
    if (!glucose || parseInt(glucose) === 0) {
      window.alert('Introduce tu nivel de glucosa para continuar.');
      return;
    }
    if (!deviceId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/diabetes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          glucose: parseInt(glucose),
          moment,
          medication: medication.trim(),
          symptoms,
          notes: notes.trim(),
        }),
      });
      if (!res.ok) throw new Error('Error guardando');
      window.alert('Registro guardado.');
      router.back();
    } catch (e) {
      window.alert('Algo salió mal. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[C.forestDeep, C.forest]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.mint} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerEye}>Mi Salud</Text>
          <Text style={styles.headerTitle}>Nuevo registro</Text>
          <Text style={styles.headerSub}>Escucha lo que tu cuerpo dice hoy.</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Glucosa */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Nivel de glucosa</Text>
          <GlucoseInput value={glucose} onChange={setGlucose} />
        </View>

        {/* Momento */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: C.gold + '22' }]}>
              <Ionicons name="time-outline" size={18} color={C.gold} />
            </View>
            <Text style={styles.sectionTitle}>¿Cuándo lo mediste?</Text>
          </View>
          <View style={styles.chips}>
            {MOMENTS.map(m => (
              <Chip
                key={m.key}
                label={m.label}
                selected={moment === m.key}
                accent={C.forest}
                onPress={() => setMoment(m.key)}
              />
            ))}
          </View>
        </View>

        {/* Medicación */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#5B8DB822' }]}>
              <Ionicons name="medical-outline" size={18} color="#5B8DB8" />
            </View>
            <Text style={styles.sectionTitle}>Medicación o insulina</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Metformina 500mg, insulina 10U…"
            placeholderTextColor={C.warmGray}
            value={medication}
            onChangeText={setMedication}
          />
        </View>

        {/* Síntomas */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#C07A5A22' }]}>
              <Ionicons name="body-outline" size={18} color="#C07A5A" />
            </View>
            <Text style={styles.sectionTitle}>¿Cómo te sientes?</Text>
          </View>
          <View style={styles.chips}>
            {SYMPTOMS.map(s => (
              <Chip
                key={s}
                label={s}
                selected={symptoms.includes(s)}
                accent="#C07A5A"
                onPress={() => toggleSymptom(s)}
              />
            ))}
          </View>
        </View>

        {/* Notas */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: C.gold + '22' }]}>
              <Ionicons name="pencil-outline" size={18} color={C.gold} />
            </View>
            <Text style={styles.sectionTitle}>Notas adicionales</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Lo que quieras recordar…"
            placeholderTextColor={C.warmGray}
            multiline numberOfLines={4}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          <LinearGradient
            colors={saving ? [C.warmGray, C.warmGray] : [C.forestDeep, C.forest]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar registro'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>Con amor, para ti</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingBottom: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  backBtn: { marginTop: 4 },
  headerEye: { color: C.sage, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6, opacity: 0.8 },
  headerTitle: { color: C.white, fontSize: 24, fontWeight: '300', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 30, marginBottom: 4 },
  headerSub: { color: C.sage, fontSize: 13, fontStyle: 'italic', opacity: 0.85 },
  scroll: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 48, gap: 14 },
  card: { backgroundColor: C.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.warm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 16 },
  glucoseWrap: { gap: 10 },
  glucoseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glucoseInput: { fontSize: 48, fontWeight: '300', width: 100 },
  glucoseUnit: { fontSize: 16, color: C.muted, marginTop: 8 },
  glucoseLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginLeft: 8 },
  glucoseDot: { width: 7, height: 7, borderRadius: 4 },
  glucoseLabelText: { fontSize: 13, fontWeight: '500' },
  glucoseHint: { fontSize: 11, color: C.muted, fontStyle: 'italic' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '500', color: C.charcoal, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1.5, gap: 5 },
  chipText: { fontSize: 13, color: C.muted },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  textInput: { backgroundColor: C.parchment, borderRadius: 14, padding: 14, fontSize: 14, color: C.charcoal, borderWidth: 1, borderColor: C.warm },
  textArea: { backgroundColor: C.parchment, borderRadius: 14, padding: 16, fontSize: 14, color: C.charcoal, lineHeight: 24, minHeight: 100, borderWidth: 1, borderColor: C.warm, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  saveBtn: { borderRadius: 18, paddingVertical: 18, alignItems: 'center', shadowColor: C.forest, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  saveBtnText: { color: C.white, fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  footer: { textAlign: 'center', color: C.muted, fontSize: 12, fontStyle: 'italic', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
