import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ─── Palette ──────────────────────────────────────────────
const C = {
  forest:    '#4A664D',
  forestDim: '#3A5140',
  moss:      '#6B8F6E',
  sage:      '#A8C5A0',
  mint:      '#D4E8D0',
  cream:     '#F8F7F2',
  parchment: '#F0EDE4',
  warmGray:  '#C8C3B8',
  charcoal:  '#3D3A35',
  text:      '#2E2B26',
  textMuted: '#7A7570',
  white:     '#FFFFFF',
  error:     '#C0614A',
};

// ─── Tag Options ───────────────────────────────────────────
const OPTIONS = {
  cuerpo: ['Pinchazos', 'Ardor', 'Electricidad', 'Cuerpo de plomo', 'Rigidez', 'Latidos', 'Tensión', 'Adormecimiento'],
  mente:  ['Nublada', 'Saturada', 'En pausa', 'Modo supervivencia', 'Desconectada', 'Inquieta', 'Agotada', 'Presente'],
  alma:   ['Invisibilidad', 'Cansancio de ser fuerte', 'Pequeña', 'Un hilo de esperanza', 'Orgullo de seguir', 'Gratitud', 'Soledad'],
  suelto: ['La culpa', 'La exigencia', 'El miedo a fallar', 'La presión de estar bien', 'Las expectativas', 'El control'],
};

const SECTION_META = {
  cuerpo: { label: 'Mi cuerpo siente…',  emoji: '🌿', accent: '#6B8F6E' },
  mente:  { label: 'Mi mente está…',     emoji: '🌫️', accent: '#8E9BAD' },
  alma:   { label: 'Mi alma siente…',    emoji: '🕊️', accent: '#B09BB0' },
  suelto: { label: 'Hoy suelto…',        emoji: '🍃', accent: '#A8B89A' },
};

// ─── Animated Chip ─────────────────────────────────────────
function Chip({ label, selected, onPress, accent }: {
  label: string; selected: boolean; onPress: () => void; accent: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <Animated.View
          style={[
            styles.chip,
            {
              borderColor: selected ? accent : C.warmGray,
              backgroundColor: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [C.cream, accent + '22'],
              }) as any,
            },
          ]}
        >
          <Text style={[styles.chipText, selected && { color: accent, fontWeight: '600' }]}>
            {label}
          </Text>
          {selected && (
            <View style={[styles.chipDot, { backgroundColor: accent }]} />
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Pain Dial ─────────────────────────────────────────────
function PainSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getColor = (v: number) => {
    if (v <= 2) return '#7BAF7E';
    if (v <= 4) return '#A8C07A';
    if (v <= 6) return '#D4A96A';
    if (v <= 8) return '#C07A5A';
    return '#A85050';
  };

  const getEmoji = (v: number) => {
    if (v === 0) return '😌';
    if (v <= 2) return '🌿';
    if (v <= 4) return '😐';
    if (v <= 6) return '😔';
    if (v <= 8) return '😣';
    return '💙';
  };

  return (
    <View style={styles.painContainer}>
      <View style={styles.painHeader}>
        <Text style={styles.painEmoji}>{getEmoji(value)}</Text>
        <View>
          <Text style={styles.painValue}>{value}</Text>
          <Text style={styles.painLabel}>/ 10</Text>
        </View>
      </View>
      <View style={styles.painTrack}>
        {levels.map((v) => {
          const active = v <= value;
          const isSelected = v === value;
          return (
            <TouchableOpacity key={v} onPress={() => onChange(v)} activeOpacity={0.7}>
              <View
                style={[
                  styles.painNode,
                  active && { backgroundColor: getColor(value), borderColor: getColor(value) },
                  isSelected && styles.painNodeSelected,
                ]}
              >
                <Text style={[styles.painNodeText, active && { color: C.white }]}>
                  {v}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.painScale}>
        <Text style={styles.painScaleText}>Sin dolor</Text>
        <Text style={styles.painScaleText}>Muy intenso</Text>
      </View>
    </View>
  );
}

// ─── Section Card ──────────────────────────────────────────
function SectionCard({ sectionKey, selections, onToggle }: {
  sectionKey: keyof typeof OPTIONS;
  selections: string[];
  onToggle: (key: keyof typeof OPTIONS, tag: string) => void;
}) {
  const meta = SECTION_META[sectionKey];
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>{meta.emoji}</Text>
        <Text style={styles.sectionTitle}>{meta.label}</Text>
      </View>
      <View style={styles.chipsWrap}>
        {OPTIONS[sectionKey].map((tag) => (
          <Chip
            key={tag}
            label={tag}
            selected={selections.includes(tag)}
            accent={meta.accent}
            onPress={() => onToggle(sectionKey, tag)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────
export default function NewDiaryEntry() {
  const [painLevel, setPainLevel] = useState(5);
  const [selections, setSelections] = useState<Record<keyof typeof OPTIONS, string[]>>({
    cuerpo: [],
    mente:  [],
    alma:   [],
    suelto: [],
  });
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleTag = (key: keyof typeof OPTIONS, tag: string) => {
    setSelections((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nivel_dolor: painLevel,
        cuerpo: selections.cuerpo,
        mente:  selections.mente,
        alma:   selections.alma,
        suelto: selections.suelto,
        nota:   nota.trim(),
      };

      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      Alert.alert('💚 Guardado', 'Tu entrada ha sido registrada con cariño.');
    } catch (err: any) {
      Alert.alert('Algo salió mal', err.message || 'Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const totalSelected = Object.values(selections).flat().length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <LinearGradient
        colors={[C.forest, C.moss]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerEyebrow}>Mi Refugio</Text>
        <Text style={styles.headerTitle}>¿Cómo grita el dolor hoy?</Text>
        <Text style={styles.headerSub}>Respira. Aquí puedes ser tú.</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Pain Selector ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Nivel de dolor</Text>
          <PainSelector value={painLevel} onChange={setPainLevel} />
        </View>

        {/* ── Tag Sections ── */}
        {(Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]).map((key) => (
          <SectionCard
            key={key}
            sectionKey={key}
            selections={selections[key]}
            onToggle={toggleTag}
          />
        ))}

        {/* ── Free Text ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>✍️</Text>
            <Text style={styles.sectionTitle}>Escribe lo que el cuerpo calla</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Suelta aquí tus pensamientos…"
            placeholderTextColor={C.warmGray}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={nota}
            onChangeText={setNota}
          />
          <Text style={styles.charCount}>{nota.length} caracteres</Text>
        </View>

        {/* ── Summary Pill ── */}
        {totalSelected > 0 && (
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>
              {totalSelected} sensación{totalSelected !== 1 ? 'es' : ''} reconocida{totalSelected !== 1 ? 's' : ''} 🌿
            </Text>
          </View>
        )}

        {/* ── Save Button ── */}
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          <LinearGradient
            colors={saving ? [C.warmGray, C.warmGray] : [C.forest, C.forestDim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Guardando…' : 'Guardar en mi diario'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>Con amor, para ti 🌿</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerEyebrow: {
    color: C.mint,
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '500',
  },
  headerTitle: {
    color: C.white,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 6,
  },
  headerSub: {
    color: C.sage,
    fontSize: 14,
    fontStyle: 'italic',
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 16,
  },

  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },

  // ── Pain ──
  painContainer: { gap: 12 },
  painHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  painEmoji: { fontSize: 36 },
  painValue: {
    fontSize: 42,
    fontWeight: '800',
    color: C.charcoal,
    lineHeight: 44,
  },
  painLabel: {
    fontSize: 14,
    color: C.textMuted,
  },
  painTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  painNode: {
    width: (width - 32 - 40 - 10 * 4) / 11,
    height: (width - 32 - 40 - 10 * 4) / 11,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: C.warmGray,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painNodeSelected: {
    transform: [{ scale: 1.25 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  painNodeText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
  },
  painScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  painScaleText: {
    fontSize: 11,
    color: C.textMuted,
    fontStyle: 'italic',
  },

  // ── Sections ──
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.charcoal,
    flex: 1,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1.5,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '400',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ── Text Area ──
  textArea: {
    backgroundColor: C.parchment,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: C.text,
    lineHeight: 22,
    minHeight: 110,
    borderWidth: 1,
    borderColor: C.mint,
  },
  charCount: {
    fontSize: 11,
    color: C.warmGray,
    textAlign: 'right',
    marginTop: 4,
  },

  // ── Summary ──
  summaryPill: {
    backgroundColor: C.mint,
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  summaryText: {
    color: C.forestDim,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Save ──
  saveBtn: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  footer: {
    textAlign: 'center',
    color: C.warmGray,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
});