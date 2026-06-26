import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { registrarSintomasCronico } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Ellipse, G, Text as SvgText } from 'react-native-svg';

const colorText   = '#5C3A1E';
const colorAccent = '#C5A059';
const colorSoft   = '#8B5A2B';
const colorMuted  = 'rgba(92,58,30,0.4)';

// Zonas del cuerpo con su path SVG y label
const ZONAS: { key: string; label: string; cx: number; cy: number; r: number; vista: 'front' | 'back' | 'both' }[] = [
  { key: 'cabeza',         label: 'Cabeza',          cx: 100, cy: 28,  r: 18, vista: 'both' },
  { key: 'cuello',         label: 'Cuello',          cx: 100, cy: 54,  r: 10, vista: 'both' },
  { key: 'hombro_izq',    label: 'Hombro izq.',     cx: 62,  cy: 75,  r: 12, vista: 'both' },
  { key: 'hombro_der',    label: 'Hombro der.',     cx: 138, cy: 75,  r: 12, vista: 'both' },
  { key: 'pecho',          label: 'Pecho',           cx: 100, cy: 88,  r: 16, vista: 'front' },
  { key: 'espalda_alta',  label: 'Espalda alta',    cx: 100, cy: 88,  r: 16, vista: 'back' },
  { key: 'abdomen',        label: 'Abdomen',         cx: 100, cy: 118, r: 16, vista: 'front' },
  { key: 'espalda_baja',  label: 'Lumbar',          cx: 100, cy: 118, r: 16, vista: 'back' },
  { key: 'cadera_izq',    label: 'Cadera izq.',     cx: 74,  cy: 148, r: 12, vista: 'both' },
  { key: 'cadera_der',    label: 'Cadera der.',     cx: 126, cy: 148, r: 12, vista: 'both' },
  { key: 'muslo_izq',     label: 'Muslo izq.',      cx: 80,  cy: 188, r: 13, vista: 'both' },
  { key: 'muslo_der',     label: 'Muslo der.',      cx: 120, cy: 188, r: 13, vista: 'both' },
  { key: 'rodilla_izq',   label: 'Rodilla izq.',    cx: 80,  cy: 228, r: 11, vista: 'both' },
  { key: 'rodilla_der',   label: 'Rodilla der.',    cx: 120, cy: 228, r: 11, vista: 'both' },
  { key: 'gemelo_izq',    label: 'Gemelo izq.',     cx: 80,  cy: 262, r: 11, vista: 'both' },
  { key: 'gemelo_der',    label: 'Gemelo der.',     cx: 120, cy: 262, r: 11, vista: 'both' },
  { key: 'pie_izq',       label: 'Pie izq.',        cx: 78,  cy: 298, r: 10, vista: 'both' },
  { key: 'pie_der',       label: 'Pie der.',        cx: 122, cy: 298, r: 10, vista: 'both' },
];

// Silueta SVG frontal/trasera simplificada
function BodySilhouette({ vista, zonas, onZona }: {
  vista: 'front' | 'back';
  zonas: string[];
  onZona: (key: string) => void;
}) {
  const visibles = ZONAS.filter(z => z.vista === 'both' || z.vista === vista);

  return (
    <Svg width={200} height={320} viewBox="0 0 200 320">
      {/* Silueta cuerpo — outline minimalista */}
      {/* Cabeza */}
      <Circle cx={100} cy={28} r={20} fill="rgba(197,160,89,0.08)" stroke="rgba(197,160,89,0.3)" strokeWidth={1.5} />
      {/* Cuello */}
      <Path d="M92 46 L108 46 L110 62 L90 62 Z" fill="rgba(197,160,89,0.08)" stroke="rgba(197,160,89,0.3)" strokeWidth={1.5} />
      {/* Torso */}
      <Path d="M68 62 Q58 68 55 80 L52 140 Q52 148 60 150 L140 150 Q148 148 148 140 L145 80 Q142 68 132 62 Z"
        fill="rgba(197,160,89,0.06)" stroke="rgba(197,160,89,0.3)" strokeWidth={1.5} />
      {/* Brazo izquierdo */}
      <Path d="M55 75 Q42 80 38 100 L36 135 Q36 142 42 143 L54 143 Q60 142 62 135 L65 100 Z"
        fill="rgba(197,160,89,0.06)" stroke="rgba(197,160,89,0.3)" strokeWidth={1.5} />
      {/* Brazo derecho */}
      <Path d="M145 75 Q158 80 162 100 L164 135 Q164 142 158 143 L146 143 Q140 142 138 135 L135 100 Z"
        fill="rgba(197,160,89,0.06)" stroke="rgba(197,160,89,0.3)" strokeWidth={1.5} />
      {/* Pierna izquierda */}
      <Path d="M60 150 L75 150 L80 230 L72 295 L65 295 L58 230 Z"
        fill="rgba(197,160,89,0.06)" stroke="rgba(197,160,89,0.3)" strokeWidth={1.5} />
      {/* Pierna derecha */}
      <Path d="M140 150 L125 150 L120 230 L128 295 L135 295 L142 230 Z"
        fill="rgba(197,160,89,0.06)" stroke="rgba(197,160,89,0.3)" strokeWidth={1.5} />

      {/* Zonas tocables */}
      {visibles.map((zona) => {
        const activa = zonas.includes(zona.key);
        return (
          <G key={zona.key} onPress={() => onZona(zona.key)}>
            <Circle
              cx={zona.cx}
              cy={zona.cy}
              r={zona.r}
              fill={activa ? colorAccent : 'transparent'}
              opacity={activa ? 0.35 : 0}
            />
            <Circle
              cx={zona.cx}
              cy={zona.cy}
              r={zona.r}
              fill="transparent"
              stroke={activa ? colorAccent : 'transparent'}
              strokeWidth={activa ? 1.5 : 0}
            />
          </G>
        );
      })}
    </Svg>
  );
}

// Matices de dolor
const INTENSIDADES = ['Leve', 'Moderado', 'Intenso', 'Insoportable'];
const TIPOS = ['Punzante', 'Sordo', 'Ardor', 'Presión', 'Calambre', 'Entumecimiento'];

export default function SintomasCronicoScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { lastCiclo } = useUserStore();
  const fase = lastCiclo?.fase ?? 'Sin datos';
  const faseColors: Record<string, string> = {
    MENSTRUAL: '#C5A059', FOLICULAR: '#7AAE8C', OVULATORIA: '#E8A87C',
    LÚTEA: '#9B7FB6', PLENITUD: '#8B5A2B'
  };
  const faseColor = faseColors[fase] || colorAccent;

  const [vista, setVista] = useState<'front' | 'back'>('front');
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<string[]>([]);
  const [intensidad, setIntensidad] = useState<string>('');
  const [tipos, setTipos] = useState<string[]>([]);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleZona = async (key: string) => {
    try {
      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setZonasSeleccionadas(prev =>
      prev.includes(key) ? prev.filter(z => z !== key) : [...prev, key]
    );
  };

  const toggleTipo = (t: string) => {
    setTipos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSave = async () => {
    if (zonasSeleccionadas.length === 0) {
      Alert.alert('Tu santuario', 'Toca las zonas donde sientes molestia hoy.');
      return;
    }
    setLoading(true);
    try {
      const labels = zonasSeleccionadas.map(k => ZONAS.find(z => z.key === k)?.label || k);
      await registrarSintomasCronico({
        device_id: user?.email || 'anonymous',
        sintomas: zonasSeleccionadas,
        zona: labels.join(', '),
        notas: `${intensidad ? 'Intensidad: ' + intensidad + '. ' : ''}${tipos.length ? 'Tipo: ' + tipos.join(', ') + '. ' : ''}${notas}`.trim(),
      });
      try {
        if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert('Registro guardado', 'Tu cuerpo te agradece por escucharlo.', [
        { text: 'Finalizar', onPress: () => router.replace('/(tabs)/home') }
      ]);
    } catch {
      Alert.alert('Error', 'No pudimos conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const zonasLabels = zonasSeleccionadas.map(k => ZONAS.find(z => z.key === k)?.label || k);

  return (
    <View style={s.container}>
      <LinearGradient colors={['#FBF8F4', '#F2EBE0', '#E8D9C4']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colorSoft} />
          </TouchableOpacity>
          <Text style={s.title}>Mi Estado Actual</Text>
          <Text style={s.subtitle}>Toca las zonas donde sientes molestia hoy</Text>
        </Animated.View>

        {/* Toggle front/back */}
        <Animated.View entering={FadeInDown.delay(100)} style={s.toggleRow}>
          <TouchableOpacity
            style={[s.toggleBtn, vista === 'front' && s.toggleActive]}
            onPress={() => setVista('front')}
          >
            <Text style={[s.toggleText, vista === 'front' && s.toggleTextActive]}>FRONTAL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleBtn, vista === 'back' && s.toggleActive]}
            onPress={() => setVista('back')}
          >
            <Text style={[s.toggleText, vista === 'back' && s.toggleTextActive]}>POSTERIOR</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Silueta */}
        <Animated.View entering={FadeInDown.delay(150)} style={s.bodyContainer}>
          <BodySilhouette vista={vista} zonas={zonasSeleccionadas} onZona={toggleZona} />
        </Animated.View>

        {/* Zonas seleccionadas */}
        {zonasSeleccionadas.length > 0 && (
          <Animated.View entering={FadeInDown.delay(50)} style={s.selectedRow}>
            {zonasLabels.map(label => (
              <View key={label} style={[s.selectedChip, { backgroundColor: faseColor + '22', borderColor: faseColor + '44' }]}>
                <Text style={[s.selectedChipText, { color: faseColor }]}>{label}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Intensidad */}
        <Animated.View entering={FadeInDown.delay(200)} style={s.section}>
          <Text style={s.sectionLabel}>INTENSIDAD</Text>
          <View style={s.chipsRow}>
            {INTENSIDADES.map(i => (
              <TouchableOpacity
                key={i}
                style={[s.chip, intensidad === i && { backgroundColor: faseColor, borderColor: faseColor }]}
                onPress={() => setIntensidad(intensidad === i ? '' : i)}
              >
                <Text style={[s.chipText, intensidad === i && s.chipTextActive]}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Tipo de dolor */}
        <Animated.View entering={FadeInDown.delay(250)} style={s.section}>
          <Text style={s.sectionLabel}>TIPO DE SENSACIÓN</Text>
          <View style={s.chipsRow}>
            {TIPOS.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.chip, tipos.includes(t) && { backgroundColor: faseColor, borderColor: faseColor }]}
                onPress={() => toggleTipo(t)}
              >
                <Text style={[s.chipText, tipos.includes(t) && s.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Notas */}
        <Animated.View entering={FadeInDown.delay(300)} style={s.section}>
          <Text style={s.sectionLabel}>NOTAS</Text>
          <TextInput
            style={s.input}
            placeholder="¿Hay algo más que quieras recordar?"
            placeholderTextColor={colorMuted}
            multiline
            value={notas}
            onChangeText={setNotas}
          />
        </Animated.View>

        {/* Guardar */}
        <Animated.View entering={FadeInDown.delay(350)}>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={[colorSoft, '#704923']} style={s.gradientBtn}>
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={s.saveBtnText}>GUARDAR EN MI BITÁCORA</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 58, paddingBottom: 60 },

  header: { alignItems: 'center', marginBottom: 24 },
  backBtn: { position: 'absolute', left: 0, top: 2 },
  title: { fontSize: 20, fontWeight: '300', color: colorText, letterSpacing: 1 },
  subtitle: { fontSize: 11, color: colorMuted, marginTop: 6, letterSpacing: 0.5 },

  toggleRow: { flexDirection: 'row', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: 3, marginBottom: 24, gap: 2 },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 17 },
  toggleActive: { backgroundColor: 'white', shadowColor: colorSoft, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  toggleText: { fontSize: 9, color: colorMuted, fontWeight: '700', letterSpacing: 2 },
  toggleTextActive: { color: colorSoft },

  bodyContainer: { alignItems: 'center', marginBottom: 20 },

  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, paddingHorizontal: 4 },
  selectedChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  selectedChipText: { fontSize: 11, fontWeight: '600' },

  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 8.5, color: colorMuted, letterSpacing: 3.5, fontWeight: '600', marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(197,160,89,0.25)', backgroundColor: 'rgba(255,255,255,0.6)' },
  chipText: { fontSize: 12, color: colorSoft },
  chipTextActive: { color: 'white', fontWeight: '600' },

  input: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 18, padding: 16, height: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(197,160,89,0.15)', color: colorText, fontSize: 13 },

  saveBtn: { borderRadius: 22, overflow: 'hidden', marginTop: 8 },
  gradientBtn: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 11, letterSpacing: 2.5 },
});