import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Dimensions, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/useStore';
import { createDiaryEntry } from '../../src/services/api';

const { width } = Dimensions.get('window');

const C = {
  forest: '#4A664D', forestDim: '#3A5140', forestDeep: '#2C3D2E',
  moss: '#6B8F6E', sage: '#A8C5A0',
  mint: '#D4E8D0', mintSoft: '#EAF4E8', cream: '#F8F7F2', parchment: '#F0EDE4',
  warm: '#E8E2D8', warmGray: '#C8C3B8', charcoal: '#3D3A35', muted: '#9A958E',
  white: '#FFFFFF', gold: '#C9A84C',
};

const OPTIONS = {
  cuerpo: ['Pinchazos', 'Ardor', 'Electricidad', 'Cuerpo de plomo', 'Rigidez', 'Latidos', 'Tensión', 'Adormecimiento'],
  mente:  ['Nublada', 'Saturada', 'En pausa', 'Modo supervivencia', 'Desconectada', 'Inquieta', 'Agotada', 'Presente'],
  alma:   ['Invisibilidad', 'Cansancio de ser fuerte', 'Pequeña', 'Un hilo de esperanza', 'Orgullo de seguir', 'Gratitud', 'Soledad'],
  suelto: ['La culpa', 'La exigencia', 'El miedo a fallar', 'La presión de estar bien', 'Las expectativas', 'El control'],
};

const META = {
  cuerpo: { label: 'Mi cuerpo siente…', icon: 'body-outline',    accent: '#6B8F6E' },
  mente:  { label: 'Mi mente está…',    icon: 'cloud-outline',   accent: '#8E9BAD' },
  alma:   { label: 'Mi alma siente…',   icon: 'heart-outline',   accent: '#B09BB0' },
  suelto: { label: 'Hoy suelto…',       icon: 'leaf-outline',    accent: '#A8B89A' },
};

function Chip({ label, selected, onPress, accent }: any) {
  const sc  = useRef(new Animated.Value(1)).current;
  const bg  = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(bg, { toValue: selected ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [selected]);
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
        <Animated.View style={[styles.chip, {
          borderColor: selected ? accent : C.warm,
          backgroundColor: bg.interpolate({ inputRange: [0, 1], outputRange: [C.cream, accent + '22'] }) as any,
        }]}>
          <Text style={[styles.chipText, selected && { color: accent, fontWeight: '600' }]}>{label}</Text>
          {selected && <View style={[styles.chipDot, { backgroundColor: accent }]} />}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function PainSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const getColor = (v: number) =>
    v <= 2 ? '#7BAF7E' : v <= 4 ? '#A8C07A' : v <= 6 ? '#D4A96A' : v <= 8 ? '#C07A5A' : '#A85050';
  const getLabel = (v: number) =>
    v === 0 ? 'Sin dolor' : v <= 2 ? 'Muy leve' : v <= 4 ? 'Leve' : v <= 6 ? 'Moderado' : v <= 8 ? 'Intenso' : 'Muy intenso';
  const color = getColor(value);
  return (
    <View style={styles.painWrap}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontSize: 40, fontWeight: '300', color }}>{value}</Text>
          <Text style={{ fontSize: 13, color: '#9A958E' }}>/ 10</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: color + '18', borderWidth: 1, borderColor: color + '40' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ fontSize: 13, fontWeight: '500', color }}>{getLabel(value)}</Text>
        </View>
      </View>
      <View style={{ height: 6, backgroundColor: '#F0EDE4', borderRadius: 3, position: 'relative', marginBottom: 16 }}>
        <View style={{ position: 'absolute', left: 0, top: 0, height: 6, borderRadius: 3, backgroundColor: color, width: (value * 10) + '%' as any }} />
        {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
          <TouchableOpacity
            key={v}
            onPress={() => onChange(v)}
            style={{
              position: 'absolute',
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: v <= value ? color : '#F8F7F2',
              borderWidth: 2,
              borderColor: v <= value ? color : '#E8E2D8',
              top: -7, marginLeft: -10,
              left: (v * 10) + '%' as any,
              transform: [{ scale: v === value ? 1.35 : 1 }],
            }}
            activeOpacity={0.7}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.painScale}>Sin dolor</Text>
        <Text style={styles.painScale}>Muy intenso</Text>
      </View>
    </View>
  );
}

export default function NewDiaryEntry() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { deviceId, incrementarContador } = useUserStore();

  const [dolor,   setDolor]   = useState(5);
  const [sel,     setSel]     = useState<Record<string, string[]>>({ cuerpo: [], mente: [], alma: [], suelto: [] });
  const [texto,   setTexto]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const toggleTag = (key: string, tag: string) => {
    setSel(prev => ({
      ...prev,
      [key]: prev[key].includes(tag)
        ? prev[key].filter(t => t !== tag)
        : [...prev[key], tag],
    }));
  };

  const handleSave = async () => {
    if (!deviceId) {
      window.alert('No se pudo identificar tu dispositivo. Intenta reiniciar la app.');
      return;
    }
    setSaving(true);
    try {
      await createDiaryEntry({
        device_id: deviceId,
        texto: texto.trim(),
        dolor,
        cuerpo: sel.cuerpo,
        mente:  sel.mente,
        alma:   sel.alma,
        suelto: sel.suelto,
      });
      incrementarContador();
      window.alert('Tu entrada ha sido registrada con cariño.');
      router.back();
    } catch (err: any) {
      window.alert(err.message || 'Algo salió mal. Por favor, inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const totalSel = Object.values(sel).flat().length;

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
          <Text style={styles.headerEye}>Mi Refugio</Text>
          <Text style={styles.headerTitle}>¿Cómo estás hoy?</Text>
          <Text style={styles.headerSub}>Respira. Aquí puedes ser tú.</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pain selector */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Nivel de dolor</Text>
          <PainSelector value={dolor} onChange={setDolor} />
        </View>

        {/* Tag sections */}
        {(Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]).map(key => (
          <View key={key} style={styles.card}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIconBox, { backgroundColor: META[key].accent + '22' }]}>
                <Ionicons name={META[key].icon as any} size={18} color={META[key].accent} />
              </View>
              <Text style={styles.sectionTitle}>{META[key].label}</Text>
            </View>
            <View style={styles.chips}>
              {OPTIONS[key].map(tag => (
                <Chip
                  key={tag} label={tag}
                  selected={sel[key].includes(tag)}
                  accent={META[key].accent}
                  onPress={() => toggleTag(key, tag)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Free text */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: C.gold + '22' }]}>
              <Ionicons name="pencil-outline" size={18} color={C.gold} />
            </View>
            <Text style={styles.sectionTitle}>Escribe lo que el cuerpo calla</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Suelta aquí tus pensamientos…"
            placeholderTextColor={C.warmGray}
            multiline numberOfLines={5}
            textAlignVertical="top"
            value={texto}
            onChangeText={setTexto}
          />
          <Text style={styles.charCount}>{texto.length} caracteres</Text>
        </View>

        {totalSel > 0 && (
          <View style={styles.summaryPill}>
            <Ionicons name="checkmark-circle-outline" size={16} color={C.forest} />
            <Text style={styles.summaryText}>
              {totalSel} sensación{totalSel !== 1 ? 'es' : ''} reconocida{totalSel !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          <LinearGradient
            colors={saving ? [C.warmGray, C.warmGray] : [C.forestDeep, C.forest]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar en mi diario'}</Text>
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
  headerEye: {
    color: C.sage, fontSize: 11, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 6, opacity: 0.8,
  },
  headerTitle: {
    color: C.white, fontSize: 24, fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 30, marginBottom: 4,
  },
  headerSub: { color: C.sage, fontSize: 13, fontStyle: 'italic', opacity: 0.85 },

  scroll: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 48, gap: 14 },

  card: {
    backgroundColor: C.white, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 16,
  },

  painWrap: { gap: 14 },
  painTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  painIconCircle: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  painBig: { fontSize: 38, fontWeight: '700', lineHeight: 40 },
  painOf: { fontSize: 12, color: C.muted },
  painNodes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  painNode: {
    width: (width - 36 - 36 - 10 * 4) / 11,
    height: (width - 36 - 36 - 10 * 4) / 11,
    borderRadius: 100, borderWidth: 1.5, borderColor: C.warm,
    backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center',
  },
  painNodeSel: {
    transform: [{ scale: 1.22 }],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 4,
  },
  painNodeNum: { fontSize: 9, fontWeight: '600', color: C.muted },
  painScale: { fontSize: 10, color: C.muted, fontStyle: 'italic' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '500', color: C.charcoal, flex: 1 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 100, borderWidth: 1.5, gap: 5,
  },
  chipText: { fontSize: 13, color: C.muted },
  chipDot: { width: 6, height: 6, borderRadius: 3 },

  textArea: {
    backgroundColor: C.parchment, borderRadius: 14, padding: 16,
    fontSize: 14, color: C.charcoal, lineHeight: 24, minHeight: 110,
    borderWidth: 1, borderColor: C.warm,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  charCount: { fontSize: 10, color: C.warmGray, textAlign: 'right', marginTop: 6 },

  summaryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.mintSoft, borderRadius: 100,
    paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'center',
    borderWidth: 1, borderColor: C.mint,
  },
  summaryText: { color: C.forestDim, fontSize: 13, fontWeight: '600' },

  saveBtn: {
    borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: C.forest, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  saveBtnText: { color: C.white, fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  footer: {
    textAlign: 'center', color: C.muted, fontSize: 12,
    fontStyle: 'italic', marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  painHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  painLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  painLabelBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  painDot: { width: 7, height: 7, borderRadius: 4 },
  painLabelText: { fontSize: 13, fontWeight: '500' },
  painTrack: { height: 6, backgroundColor: '#F0EDE4', borderRadius: 3, position: 'relative', marginBottom: 4 },
  painFill: { position: 'absolute', left: 0, top: 0, height: 6, borderRadius: 3 },
  painThumb: { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 2, top: -6, marginLeft: -9 },
});
