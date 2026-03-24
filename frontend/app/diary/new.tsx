/**
 * app/diary/new.tsx
 *
 * Pantalla de nueva entrada del diario.
 * Accesible desde:
 *   - FAB del diario: router.push('/diary/new')
 *   - Acción rápida de la home
 *
 * Secciones:
 *   1. Texto libre (cómo te sientes hoy)
 *   2. Estado emocional (6 dimensiones, escala 0-5)
 *   3. Estado físico (dolor, energía, sensibilidad, escala 0-10)
 *   4. Clima (se carga automáticamente por geolocalización)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import {
  createDiaryEntry,
  getWeather,
  EmotionalState,
  PhysicalState,
  WeatherData,
} from '../../src/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const BG = '#80704f';

// 6 emociones que el backend acepta (campo emotional_state, escala 0-5)
const EMOTIONS: Array<{
  key: keyof EmotionalState;
  labelEs: string;
  labelEn: string;
  emoji: string;
  color: string;
  positiva: boolean; // true = cuanto más mejor, false = cuanto menos mejor
}> = [
  { key: 'calma',        labelEs: 'Calma',         labelEn: 'Calm',        emoji: '🌿', color: '#9CAF88', positiva: true  },
  { key: 'gratitud',     labelEs: 'Gratitud',      labelEn: 'Gratitude',   emoji: '✨', color: '#D4B896', positiva: true  },
  { key: 'fatiga',       labelEs: 'Fatiga',        labelEn: 'Fatigue',     emoji: '🌫️', color: '#C4A484', positiva: false },
  { key: 'tension',      labelEs: 'Tensión',       labelEn: 'Tension',     emoji: '⚡', color: '#C9A587', positiva: false },
  { key: 'niebla_mental',labelEs: 'Niebla mental', labelEn: 'Brain fog',   emoji: '🌁', color: '#B8AFA7', positiva: false },
  { key: 'dolor_difuso', labelEs: 'Dolor difuso',  labelEn: 'Diffuse pain',emoji: '💜', color: '#C9A59A', positiva: false },
];

// 3 métricas físicas (escala 0-10)
const PHYSICAL: Array<{
  key: keyof PhysicalState;
  labelEs: string;
  labelEn: string;
  icon: string;
  lowLabel: string;
  highLabel: string;
}> = [
  { key: 'nivel_dolor',  labelEs: 'Dolor',       labelEn: 'Pain',        icon: 'pulse',        lowLabel: 'Sin dolor',   highLabel: 'Insoportable' },
  { key: 'energia',      labelEs: 'Energía',     labelEn: 'Energy',      icon: 'flash',        lowLabel: 'Agotada',     highLabel: 'Con energía'  },
  { key: 'sensibilidad', labelEs: 'Sensibilidad',labelEn: 'Sensitivity', icon: 'radio-button-on', lowLabel: 'Normal',   highLabel: 'Muy sensible' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componente de slider de emoción (0-5 puntos)
// ─────────────────────────────────────────────────────────────────────────────

function EmotionSlider({
  emotion,
  value,
  onChange,
  language,
}: {
  emotion: typeof EMOTIONS[0];
  value: number;
  onChange: (v: number) => void;
  language: string;
}) {
  const label = language === 'es' ? emotion.labelEs : emotion.labelEn;

  return (
    <View style={sliderStyles.wrapper}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.emoji}>{emotion.emoji}</Text>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={[sliderStyles.value, { color: value > 0 ? emotion.color : colors.textLight }]}>
          {value}/5
        </Text>
      </View>
      <View style={sliderStyles.dots}>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[
              sliderStyles.dot,
              {
                backgroundColor: n <= value ? emotion.color : colors.border,
                width: n === 0 ? 10 : 10 + n * 4,
                height: n === 0 ? 10 : 10 + n * 4,
              },
            ]}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente de slider físico (0-10)
// ─────────────────────────────────────────────────────────────────────────────

function PhysicalSlider({
  metric,
  value,
  onChange,
  language,
}: {
  metric: typeof PHYSICAL[0];
  value: number;
  onChange: (v: number) => void;
  language: string;
}) {
  const label = language === 'es' ? metric.labelEs : metric.labelEn;

  return (
    <View style={sliderStyles.wrapper}>
      <View style={sliderStyles.header}>
        <Ionicons name={metric.icon as any} size={16} color={colors.warmBrown} />
        <Text style={[sliderStyles.label, { marginLeft: 6 }]}>{label}</Text>
        <Text style={[sliderStyles.value, { color: colors.warmBrown }]}>{value}/10</Text>
      </View>
      <View style={sliderStyles.numberRow}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[
              sliderStyles.numberBtn,
              n <= value && { backgroundColor: colors.warmBrown },
              n === value && sliderStyles.numberBtnActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                sliderStyles.numberText,
                n <= value && { color: colors.softWhite },
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={sliderStyles.scaleLabels}>
        <Text style={sliderStyles.scaleLabel}>{metric.lowLabel}</Text>
        <Text style={sliderStyles.scaleLabel}>{metric.highLabel}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────────────────────────────────────

export default function NewDiaryEntry() {
  const router   = useRouter();
  const { deviceId, language } = useStore();

  // Texto libre
  const [texto, setTexto] = useState('');

  // Estado emocional (0-5 cada uno)
  const [emotional, setEmotional] = useState<EmotionalState>({
    calma: 0, gratitud: 0, fatiga: 0, tension: 0, niebla_mental: 0, dolor_difuso: 0,
  });

  // Estado físico (0-10 cada uno)
  const [physical, setPhysical] = useState<PhysicalState>({
    nivel_dolor: 0, energia: 5, sensibilidad: 0,
  });

  // Clima
  const [weather, setWeather]         = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // UI
  const [saving, setSaving]     = useState(false);
  const [section, setSection]   = useState<'texto' | 'emocional' | 'fisico'>('texto');
  const scrollRef               = useRef<ScrollView>(null);

  const isEs = language === 'es';

  // Cargar clima al montar
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc  = await Location.getCurrentPositionAsync({});
          const data = await getWeather(loc.coords.latitude, loc.coords.longitude);
          setWeather(data);
        }
      } catch { /* clima opcional */ } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const updateEmotion = (key: keyof EmotionalState, value: number) => {
    setEmotional(prev => ({ ...prev, [key]: value }));
  };

  const updatePhysical = (key: keyof PhysicalState, value: number) => {
    setPhysical(prev => ({ ...prev, [key]: value }));
  };

  // ¿El usuario ha registrado algo?
  const hasContent =
    texto.trim().length > 0 ||
    Object.values(emotional).some(v => (v ?? 0) > 0) ||
    physical.nivel_dolor > 0 ||
    physical.energia !== 5 ||
    physical.sensibilidad > 0;

  const handleSave = async () => {
    if (!deviceId) {
      Alert.alert(
        isEs ? 'Error' : 'Error',
        isEs ? 'No se pudo identificar tu dispositivo' : 'Device ID not found'
      );
      return;
    }

    if (!hasContent) {
      Alert.alert(
        isEs ? 'Entrada vacía' : 'Empty entry',
        isEs
          ? 'Añade al menos una frase o ajusta algún estado antes de guardar.'
          : 'Add at least a sentence or adjust a state before saving.'
      );
      return;
    }

    setSaving(true);
    try {
      await createDiaryEntry({
        device_id:       deviceId,
        texto:           texto.trim() || undefined,
        emotional_state: emotional,
        physical_state:  physical,
        weather:         weather ?? undefined,
      });

      // Volver al diario con éxito
      router.back();
    } catch (e: any) {
      Alert.alert(
        isEs ? 'Error al guardar' : 'Save error',
        e?.message ?? (isEs ? 'Inténtalo de nuevo' : 'Please try again')
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const SECTIONS = [
    { key: 'texto',     label: isEs ? 'Cómo estás' : 'How you feel', icon: 'chatbubble-outline' },
    { key: 'emocional', label: isEs ? 'Emociones'  : 'Emotions',     icon: 'heart-outline'      },
    { key: 'fisico',    label: isEs ? 'Cuerpo'     : 'Body',         icon: 'pulse-outline'      },
  ] as const;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.softWhite} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEs ? 'Nueva entrada' : 'New entry'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.softWhite} />
              : <Text style={styles.saveBtnText}>{isEs ? 'Guardar' : 'Save'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Fecha y clima ── */}
        <View style={styles.metaRow}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString(isEs ? 'es-ES' : 'en-US', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </Text>
          {weatherLoading && (
            <ActivityIndicator size="small" color={colors.softWhite} style={{ marginLeft: 8 }} />
          )}
          {weather && !weatherLoading && (
            <View style={styles.weatherChip}>
              <Ionicons name="partly-sunny-outline" size={13} color={colors.softWhite} />
              <Text style={styles.weatherText}>
                {Math.round(weather.temperature)}°C · {weather.humidity}%
              </Text>
            </View>
          )}
        </View>

        {/* ── Pestañas de sección ── */}
        <View style={styles.tabs}>
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.tab, section === s.key && styles.tabActive]}
              onPress={() => setSection(s.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={s.icon as any}
                size={15}
                color={section === s.key ? colors.warmBrownDark : colors.softWhite}
              />
              <Text style={[styles.tabText, section === s.key && styles.tabTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Contenido por sección ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Sección 1: Texto libre */}
          {section === 'texto' && (
            <View>
              <Text style={styles.sectionHint}>
                {isEs
                  ? 'Escribe lo que quieras. No hay forma incorrecta de hacerlo.'
                  : 'Write whatever you want. There is no wrong way to do it.'}
              </Text>
              <View style={styles.textCard}>
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder={
                    isEs
                      ? 'Hoy me siento...'
                      : 'Today I feel...'
                  }
                  placeholderTextColor={colors.textLight}
                  value={texto}
                  onChangeText={setTexto}
                  textAlignVertical="top"
                  autoFocus
                />
              </View>
              <Text style={styles.charCount}>{texto.length} caracteres</Text>

              {/* Sugerencias rápidas */}
              <Text style={styles.sectionLabel}>
                {isEs ? 'Frases de inicio' : 'Starter phrases'}
              </Text>
              <View style={styles.suggestions}>
                {(isEs ? [
                  'Hoy el dolor está...',
                  'Me siento agotada porque...',
                  'Lo que más me pesa hoy es...',
                  'Un pequeño logro de hoy fue...',
                  'Necesito decir que...',
                ] : [
                  'Today the pain is...',
                  'I feel exhausted because...',
                  'What weighs on me most is...',
                  'A small win today was...',
                  'I need to say that...',
                ]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionChip}
                    onPress={() => setTexto(prev => prev ? prev + ' ' + s : s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Sección 2: Estado emocional */}
          {section === 'emocional' && (
            <View>
              <Text style={styles.sectionHint}>
                {isEs
                  ? 'Mueve cada estado al nivel que sientas ahora mismo. 0 = no lo siento.'
                  : 'Set each state to how you feel right now. 0 = not feeling it.'}
              </Text>
              <View style={styles.card}>
                {EMOTIONS.map((e) => (
                  <EmotionSlider
                    key={e.key}
                    emotion={e}
                    value={emotional[e.key] ?? 0}
                    onChange={(v) => updateEmotion(e.key, v)}
                    language={language}
                  />
                ))}
              </View>

              {/* Resumen visual */}
              {Object.values(emotional).some(v => (v ?? 0) > 0) && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>
                    {isEs ? 'Tu estado ahora mismo' : 'Your state right now'}
                  </Text>
                  <View style={styles.summaryChips}>
                    {EMOTIONS
                      .filter(e => (emotional[e.key] ?? 0) > 0)
                      .sort((a, b) => (emotional[b.key] ?? 0) - (emotional[a.key] ?? 0))
                      .map(e => (
                        <View
                          key={e.key}
                          style={[styles.summaryChip, { backgroundColor: e.color }]}
                        >
                          <Text style={styles.summaryChipText}>
                            {e.emoji} {language === 'es' ? e.labelEs : e.labelEn} {emotional[e.key]}
                          </Text>
                        </View>
                      ))
                    }
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Sección 3: Estado físico */}
          {section === 'fisico' && (
            <View>
              <Text style={styles.sectionHint}>
                {isEs
                  ? 'Cómo está tu cuerpo hoy. Sé honesta, nadie más verá esto.'
                  : 'How is your body today. Be honest, only you will see this.'}
              </Text>
              <View style={styles.card}>
                {PHYSICAL.map((m) => (
                  <PhysicalSlider
                    key={m.key}
                    metric={m}
                    value={physical[m.key]}
                    onChange={(v) => updatePhysical(m.key, v)}
                    language={language}
                  />
                ))}
              </View>

              {/* Indicador de dolor */}
              {physical.nivel_dolor >= 7 && (
                <View style={styles.highPainAlert}>
                  <Ionicons name="heart" size={16} color="#fff" />
                  <Text style={styles.highPainText}>
                    {isEs
                      ? 'Dolor alto detectado. Recuerda que puedes acceder a soporte de crisis en la pantalla principal.'
                      : 'High pain detected. Remember you can access crisis support from the main screen.'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Botón guardar al fondo */}
          <TouchableOpacity
            style={[styles.saveFullBtn, (!hasContent || saving) && styles.saveFullBtnDisabled]}
            onPress={handleSave}
            disabled={!hasContent || saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.saveFullBtnText}>
                    {isEs ? 'Guardar entrada' : 'Save entry'}
                  </Text>
                </>
            }
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos del slider
// ─────────────────────────────────────────────────────────────────────────────

const sliderStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
  },
  value: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_700Bold',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    borderRadius: 99,
  },
  numberRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  numberBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberBtnActive: {
    transform: [{ scale: 1.15 }],
  },
  numberText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  scaleLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textLight,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Estilos de la pantalla
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.softWhite,
  },
  saveBtn: {
    backgroundColor: colors.warmBrownDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_700Bold',
    color: colors.softWhite,
  },

  // Fecha y clima
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(245,242,239,0.8)',
    textTransform: 'capitalize',
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  weatherText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: colors.softWhite,
  },

  // Pestañas
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: borderRadius.md,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    color: 'rgba(245,242,239,0.75)',
  },
  tabTextActive: {
    color: colors.warmBrownDark,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  sectionHint: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(245,242,239,0.8)',
    marginBottom: spacing.md,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Texto libre
  textCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 180,
    marginBottom: spacing.sm,
  },
  textInput: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    lineHeight: 26,
    minHeight: 160,
  },
  charCount: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(245,242,239,0.5)',
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
    marginBottom: spacing.sm,
    opacity: 0.85,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  suggestionText: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.softWhite,
  },

  // Card contenedor para sliders
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  // Resumen emocional
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.softWhite,
    marginBottom: spacing.sm,
    opacity: 0.85,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  summaryChipText: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },

  // Alerta dolor alto
  highPainAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#8B2020',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  highPainText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: '#fff',
    lineHeight: 20,
  },

  // Botón guardar grande al fondo
  saveFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmBrownDark,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveFullBtnDisabled: {
    opacity: 0.45,
  },
  saveFullBtnText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
  },
});
