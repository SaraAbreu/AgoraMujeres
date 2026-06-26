import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useUserStore } from '../../store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import api, { getSubscriptionStatus, getDeviceIdFromToken } from '../../services/api';

const { width } = Dimensions.get('window');
const colorText   = '#5C3A1E';
const colorAccent = '#C5A059';
const colorSoft   = '#8B5A2B';
const colorMuted  = 'rgba(92,58,30,0.4)';

// Gradientes de fondo por fase
const FASE_GRADIENTS: Record<string, [string, string, string]> = {
  MENSTRUAL:   ['#FBF4F4', '#F2DDE0', '#E8C4C8'],
  FOLICULAR:   ['#F4FBF6', '#DFF2E8', '#C4E8D4'],
  OVULATORIA:  ['#FBF8F4', '#F2EBE0', '#E8D9C4'],
  LÚTEA:       ['#F8F4FB', '#EAE0F2', '#D9C4E8'],
  PLENITUD:    ['#F8F5F0', '#EDE5D8', '#E0CFBA'],
  'Sin datos': ['#FBF8F4', '#F2EBE0', '#E8D9C4'],
};

const FASE_CONFIG: Record<string, { color: string; icon: string; desc: string }> = {
  MENSTRUAL:   { color: '#C5A059', icon: 'water',                 desc: 'Renovación' },
  FOLICULAR:   { color: '#7AAE8C', icon: 'leaf',                  desc: 'Crecimiento' },
  OVULATORIA:  { color: '#E8A87C', icon: 'flower',                desc: 'Plenitud' },
  LÚTEA:       { color: '#9B7FB6', icon: 'moon-waning-crescent',  desc: 'Introspección' },
  PLENITUD:    { color: '#8B5A2B', icon: 'infinity',              desc: 'Sabiduría' },
  'Sin datos': { color: '#D1C4B2', icon: 'help-circle-outline',   desc: 'Sin registros' },
};

const AGORA_MESSAGES: Record<string, string> = {
  MENSTRUAL:   'Tu cuerpo pide descanso hoy. No hay nada que demostrar.',
  FOLICULAR:   'Algo se despierta en ti. ¿Cómo te sientes con esta nueva energía?',
  OVULATORIA:  'Tu energía está alta. Aprovéchala con calma — el dolor crónico también descansa.',
  LÚTEA:       'La fase introspectiva invita a escucharte sin juicio.',
  PLENITUD:    'Tu experiencia es sabiduría. Estoy aquí cuando lo necesites.',
  'Sin datos': '¿Cómo te encuentras hoy? Estoy aquí para acompañarte.',
};

const AFIRMACIONES = [
  'Cuidarte no es debilidad, es sabiduría.',
  'Tu cuerpo merece compasión, no exigencia.',
  'Hoy basta con estar aquí.',
  'El descanso también es productivo.',
  'Escucharte es el acto de amor más valioso.',
  'No tienes que justificar tu dolor.',
  'Pequeños pasos también son avances.',
];

const DOLOR_CONFIG = [
  { label: 'Bien',         icon: 'sunny-outline',        color: '#7AAE8C' },
  { label: 'Regular',      icon: 'cloud-outline',         color: '#C5A059' },
  { label: 'Con dolor',    icon: 'rainy-outline',         color: '#E8A87C' },
  { label: 'Mucho dolor',  icon: 'thunderstorm-outline',  color: '#C5806A' },
  { label: 'Insoportable', icon: 'flame-outline',         color: '#9B5A5A' },
];

const ZONAS = [
  { key: 'lumbar',         label: 'Lumbar' },
  { key: 'cabeza',         label: 'Cabeza' },
  { key: 'articulaciones', label: 'Articulaciones' },
  { key: 'abdomen',        label: 'Abdomen' },
  { key: 'general',        label: 'General' },
];

const SINTOMAS_RAPIDOS = [
  { key: 'fatiga',        label: 'Fatiga' },
  { key: 'niebla_mental', label: 'Niebla mental' },
  { key: 'nauseas',       label: 'Náuseas' },
  { key: 'inflamacion',   label: 'Inflamación' },
];

// Colores del heatmap por nivel de dolor (1-5)
const HEATMAP_COLORS = ['#7AAE8C', '#C5A059', '#E8A87C', '#C5806A', '#9B5A5A'];
const DAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// ── Anillo SVG del ciclo ──────────────────────────────────────────────────────
const RING = 200;
const STROKE = 13;
const R = (RING / 2) - STROKE;
const CIRC = 2 * Math.PI * R;

function CycleRing({ dia, duracion, fase, color }: { dia: number; duracion: number; fase: string; color: string }) {
  const progress = duracion > 0 ? Math.min(dia / duracion, 1) : 0;
  const dash = CIRC * progress;
  const gap  = CIRC - dash;
  const daysLeft = Math.max(0, duracion - dia);

  return (
    <View style={s.ringWrap}>
      <Svg width={RING} height={RING}>
        {/* Track */}
        <Circle cx={RING/2} cy={RING/2} r={R} stroke={color + '25'} strokeWidth={STROKE} fill="none" />
        {/* Progress */}
        <Circle
          cx={RING/2} cy={RING/2} r={R}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING/2} ${RING/2})`}
        />
      </Svg>
      {/* Centro */}
      <View style={s.ringCenter}>
        <Text style={[s.ringDay, { color }]}>{dia}</Text>
        <Text style={s.ringDayLabel}>DÍA</Text>
        <Text style={[s.ringFase, { color }]}>{fase}</Text>
      </View>
      {/* Días restantes */}
      {daysLeft > 0 && (
        <View style={s.ringFooter}>
          <Ionicons name="time-outline" size={10} color={colorMuted} />
          <Text style={s.ringFooterText}>próxima menstruación en {daysLeft} días</Text>
        </View>
      )}
    </View>
  );
}

// ── Heatmap semanal ───────────────────────────────────────────────────────────
function WeekHeatmap({ entries }: { entries: Array<{ date: string; pain: number | null }> }) {
  return (
    <View style={s.heatmapWrap}>
      <Text style={s.heatmapTitle}>ESTA SEMANA</Text>
      <View style={s.heatmapRow}>
        {entries.map((e, i) => {
          const hasData = e.pain !== null;
          const bg = hasData ? HEATMAP_COLORS[(e.pain! - 1)] + 'CC' : 'rgba(139,90,43,0.08)';
          return (
            <View key={i} style={s.heatmapItem}>
              <View style={[s.heatmapDot, { backgroundColor: bg, borderColor: hasData ? HEATMAP_COLORS[(e.pain! - 1)] + '50' : 'rgba(139,90,43,0.1)' }]}>
                {hasData && <Ionicons name={DOLOR_CONFIG[e.pain! - 1].icon as any} size={16} color={HEATMAP_COLORS[e.pain! - 1]} />}
              </View>
              <Text style={s.heatmapDay}>{DAYS_ES[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Acciones rápidas ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Diario',    icon: 'create-outline',      route: '/(tabs)/diario'            },
  { label: 'Síntomas',  icon: 'pulse-outline',        route: '/(tabs)/sintomas-cronico'  },
  { label: 'Ciclo',     icon: 'moon-outline',         route: '/ciclo'                    },
  { label: 'Historial', icon: 'bar-chart-outline',    route: '/(tabs)/historial-clinico' },
] as const;

function QuickActions({ color, router }: { color: string; router: any }) {
  return (
    <View style={qa.row}>
      {QUICK_ACTIONS.map((a) => (
        <TouchableOpacity key={a.label} style={qa.item} onPress={() => router.push(a.route as any)} activeOpacity={0.6}>
          <Ionicons name={a.icon as any} size={22} color={color} style={{ opacity: 0.85 }} />
          <Text style={[qa.label, { color }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const qa = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  item:  { alignItems: 'center', gap: 5, paddingHorizontal: 8 },
  label: { fontSize: 10, fontWeight: '500', letterSpacing: 0.4, opacity: 0.85 },
});

// ── Predicción de próxima fase ────────────────────────────────────────────────
// Límites del backend: MENSTRUAL 1-5 · FOLICULAR 6-12 · OVULATORIA 13-16 · LÚTEA 17-duracion
const FASE_TIPS: Record<string, string> = {
  MENSTRUAL:  'Prioriza el descanso y el calor en el abdomen.',
  FOLICULAR:  'Buen momento para movimiento suave y nuevos hábitos.',
  OVULATORIA: 'Energía alta — escucha tu cuerpo y no te exijas de más.',
  LÚTEA:      'Reduce estimulantes y cuídate con más mimo.',
};

function getNextPhase(fase: string, diaActual: number, duracion: number) {
  let daysLeft: number;
  let nextFase: string;

  if (fase === 'MENSTRUAL')  { daysLeft = 6  - diaActual; nextFase = 'FOLICULAR';  }
  else if (fase === 'FOLICULAR')  { daysLeft = 13 - diaActual; nextFase = 'OVULATORIA'; }
  else if (fase === 'OVULATORIA') { daysLeft = 17 - diaActual; nextFase = 'LÚTEA';      }
  else if (fase === 'LÚTEA')      { daysLeft = (duracion || 28) - diaActual + 1; nextFase = 'MENSTRUAL'; }
  else return null;

  return { daysLeft: Math.max(1, daysLeft), nextFase, tip: FASE_TIPS[nextFase] };
}

const TIMER_DURATION = 5400;
const TIMER_KEY      = 'agora_timer_start';
const TIMER_DATE_KEY = 'agora_timer_date';
const DOLOR_KEY      = 'agora_dolor_level';
const DOLOR_DATE_KEY = 'agora_dolor_date';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function calcRemaining(startTs: number): number {
  return Math.max(0, TIMER_DURATION - Math.floor((Date.now() - startTs) / 1000));
}
function getISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function HomeSantuario() {
  const router  = useRouter();
  const devMode = useUserStore((s) => s.devMode);
  const { user, lastCiclo, setLastGlucosa, setLastCiclo } = useUserStore();

  const [secondsLeft, setSecondsLeft]         = useState(TIMER_DURATION);
  const [isBlocked, setIsBlocked]             = useState(false);
  const [dolorLevel, setDolorLevel]           = useState<number | null>(null);
  const [zonasSelec, setZonasSelec]           = useState<string[]>([]);
  const [sintomasSelec, setSintomasSelec]     = useState<string[]>([]);
  const [checkInGuardado, setCheckInGuardado] = useState(false);
  const [guardando, setGuardando]             = useState(false);
  const [weekEntries, setWeekEntries]         = useState<Array<{ date: string; pain: number | null }>>([]);
  const [streak, setStreak]                   = useState(0);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fase       = lastCiclo?.fase      ?? 'Sin datos';
  const diaActual  = lastCiclo?.dia_actual ?? 0;
  const duracion   = lastCiclo?.duracion   ?? 28;
  const faseConfig = FASE_CONFIG[fase] || FASE_CONFIG['Sin datos'];
  const tieneDatos = fase !== 'Sin datos' && diaActual > 0;
  const faseGrad   = FASE_GRADIENTS[fase] ?? FASE_GRADIENTS['Sin datos'];
  const nombre1    = user?.name?.split(' ')[0] || 'Diosa';

  // ── Animación de respiración ──────────────────────────────────────────────
  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);
  const overlayGradStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + breathe.value * 0.20,
  }));

  // ── Trial check ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (devMode) return;
    const checkTrial = async () => {
      const deviceId = await getDeviceIdFromToken();
      if (!deviceId) return;
      const status = await getSubscriptionStatus(deviceId);
      if (status?.status === 'expired') router.replace('/plan' as any);
    };
    checkTrial();
  }, [devMode]);

  // ── Carga de datos de ciclo ───────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/user/stats');
        if (res.data) {
          setLastGlucosa(res.data.glucosa);
          setLastCiclo(res.data.ciclo);
        }
      } catch (e) {}
    };
    fetchData();
  }, [user]);

  // ── Timer de sesión ───────────────────────────────────────────────────────
  useEffect(() => {
    const syncTimer = async () => {
      if (devMode) return;
      try {
        const savedDate = await AsyncStorage.getItem(TIMER_DATE_KEY);
        const today = todayString();
        if (savedDate !== today) {
          await AsyncStorage.setItem(TIMER_KEY, Date.now().toString());
          await AsyncStorage.setItem(TIMER_DATE_KEY, today);
          setSecondsLeft(TIMER_DURATION); setIsBlocked(false); return;
        }
        const stored = await AsyncStorage.getItem(TIMER_KEY);
        if (stored) {
          const rem = calcRemaining(parseInt(stored, 10));
          setSecondsLeft(rem);
          if (rem <= 0) setIsBlocked(true);
        }
      } catch (_) {}
    };
    syncTimer();
  }, [devMode]);

  // ── Carga check-in de hoy + heatmap semanal ──────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      // Hoy
      try {
        const res = await api.get(`/checkin/${user.id}/today`);
        if (res.data) {
          setDolorLevel(res.data.pain_level - 1);
          setZonasSelec(res.data.zonas    || []);
          setSintomasSelec(res.data.sintomas || []);
          setCheckInGuardado(true);
        }
      } catch (_) {}
      // Última semana
      try {
        const res = await api.get(`/checkin/${user.id}`, { params: { limit: 30 } });
        const entries = res.data || [];
        // Construir los últimos 7 días (lun → hoy)
        const today = new Date();
        // Ajustar al lunes de esta semana
        const dayOfWeek = today.getDay(); // 0=dom, 1=lun...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);

        const week = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return getISODate(d);
        });

        const mapped = week.map(dateStr => {
          const found = entries.find((e: any) => getISODate(new Date(e.created_at)) === dateStr);
          return { date: dateStr, pain: found ? found.pain_level : null };
        });
        setWeekEntries(mapped);

        // Calcular racha: días consecutivos hacia atrás desde hoy con check-in
        let s = 0;
        const check = new Date();
        for (let i = 0; i < 30; i++) {
          const dateStr = getISODate(check);
          const found = entries.find((e: any) => getISODate(new Date(e.created_at)) === dateStr);
          if (found) { s++; check.setDate(check.getDate() - 1); }
          else if (i === 0) { check.setDate(check.getDate() - 1); } // si hoy no hay, sigue buscando desde ayer
          else break;
        }
        setStreak(s);
      } catch (_) {}
    };
    loadData();
  }, [user]);

  // ── Auto-guardado check-in ────────────────────────────────────────────────
  const scheduleAutoSave = (nivel: number, zonas: string[], sintomas: string[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setCheckInGuardado(false);
    saveTimerRef.current = setTimeout(async () => {
      if (!user?.id) return;
      setGuardando(true);
      try {
        await api.post('/checkin', {
          device_id:  user.id,
          pain_level: nivel + 1,
          zonas, sintomas,
          fase_ciclo: fase !== 'Sin datos' ? fase : null,
          dia_ciclo:  diaActual > 0 ? diaActual : null,
        });
        setCheckInGuardado(true);
        await AsyncStorage.setItem(DOLOR_KEY, nivel.toString());
        await AsyncStorage.setItem(DOLOR_DATE_KEY, todayString());
        // Actualizar heatmap local
        setWeekEntries(prev => {
          const today = getISODate(new Date());
          return prev.map(e => e.date === today ? { ...e, pain: nivel + 1 } : e);
        });
      } catch (e) {}
      setGuardando(false);
    }, 1200);
  };

  const handleDolorSelect = (i: number) => {
    setDolorLevel(i);
    scheduleAutoSave(i, zonasSelec, sintomasSelec);
  };
  const toggleZona = (key: string) => {
    const next = zonasSelec.includes(key) ? zonasSelec.filter(z => z !== key) : [...zonasSelec, key];
    setZonasSelec(next);
    if (dolorLevel !== null) scheduleAutoSave(dolorLevel, next, sintomasSelec);
  };
  const toggleSintoma = (key: string) => {
    const next = sintomasSelec.includes(key) ? sintomasSelec.filter(s => s !== key) : [...sintomasSelec, key];
    setSintomasSelec(next);
    if (dolorLevel !== null) scheduleAutoSave(dolorLevel, zonasSelec, next);
  };

  // ── PANTALLA BLOQUEADA ────────────────────────────────────────────────────
  if (isBlocked && !devMode) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <LinearGradient colors={['#FBF8F4', '#F2EBE0', '#E8D9C4']} style={StyleSheet.absoluteFill} />
        <Ionicons name="lock-closed-outline" size={56} color={colorText} style={{ opacity: 0.15, marginBottom: 24 }} />
        <Text style={s.blockedTitle}>SESIÓN COMPLETADA</Text>
        <Text style={s.blockedDesc}>Has alcanzado tu límite diario. Suscríbete para acceso ilimitado.</Text>
        <TouchableOpacity onPress={() => router.push('/plan')} style={s.premiumBtn}>
          <LinearGradient colors={['#C5A059', '#8B5A2B']} style={s.premiumBtnInner}>
            <Text style={s.premiumBtnText}>VER PLANES</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const dolorTitle =
    dolorLevel === null ? '¿Cómo está tu cuerpo hoy?'
    : guardando         ? 'Guardando...'
    : checkInGuardado   ? `✓  ${DOLOR_CONFIG[dolorLevel].label}`
    :                     DOLOR_CONFIG[dolorLevel].label;

  return (
    <View style={s.container}>
      {/* Fondo animado */}
      <LinearGradient colors={faseGrad} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Animated.View style={[StyleSheet.absoluteFill, overlayGradStyle]} pointerEvents="none">
        <LinearGradient colors={[faseGrad[2], faseGrad[1], faseGrad[0]]} style={StyleSheet.absoluteFill} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── TOPBAR ──────────────────────────────────────────────────────── */}
        <View style={s.topbar}>
          <View>
            <Text style={s.topGreeting}>Hola, {nombre1} 👋</Text>
            {tieneDatos && (
              <View style={[s.fasePill, { backgroundColor: faseConfig.color + '18' }]}>
                <MaterialCommunityIcons name={faseConfig.icon as any} size={10} color={faseConfig.color} />
                <Text style={[s.fasePillText, { color: faseConfig.color }]}>{faseConfig.desc}</Text>
              </View>
            )}
          </View>
          <View style={s.topbarRight}>
            {devMode && <View style={s.devBadge}><Text style={s.devBadgeText}>∞ DEV</Text></View>}
            {streak > 0 && (
              <View style={s.streakBadge}>
                <Text style={s.streakEmoji}>🔥</Text>
                <Text style={s.streakNum}>{streak}</Text>
              </View>
            )}
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/medical-report')} activeOpacity={0.7}>
              <Ionicons name="document-text-outline" size={16} color={colorSoft} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ACCIONES RÁPIDAS ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).duration(500)}>
          <QuickActions color={faseConfig.color} router={router} />
        </Animated.View>

        {/* ── ANILLO DEL CICLO — HÉROE ─────────────────────────────────────── */}
        {tieneDatos ? (
          <Animated.View entering={FadeIn.duration(700)} style={s.ringSection}>
            <CycleRing dia={diaActual} duracion={duracion} fase={fase} color={faseConfig.color} />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(700)} style={s.ringSection}>
            <TouchableOpacity style={s.noCycleCard} onPress={() => router.push('/(tabs)/historial-chat' as any)} activeOpacity={0.85}>
              <MaterialCommunityIcons name="calendar-heart" size={32} color={colorMuted} />
              <Text style={s.noCycleTitle}>Registra tu ciclo</Text>
              <Text style={s.noCycleDesc}>Añade tu última menstruación para ver tu anillo personalizado</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── PREDICCIÓN DE PRÓXIMA FASE ───────────────────────────────────── */}
        {tieneDatos && (() => {
          const pred = getNextPhase(fase, diaActual, duracion);
          if (!pred) return null;
          const nextConfig = FASE_CONFIG[pred.nextFase];
          return (
            <Animated.View entering={FadeInDown.delay(140).duration(500)} style={[s.predCard, { borderLeftColor: nextConfig.color }]}>
              <View style={s.predLeft}>
                <MaterialCommunityIcons name={nextConfig.icon as any} size={16} color={nextConfig.color} />
              </View>
              <View style={s.predBody}>
                <Text style={s.predEn}>En <Text style={[s.predDays, { color: nextConfig.color }]}>{pred.daysLeft} {pred.daysLeft === 1 ? 'día' : 'días'}</Text> · {pred.nextFase}</Text>
                <Text style={s.predTip}>{pred.tip}</Text>
              </View>
            </Animated.View>
          );
        })()}

        {/* ── HEATMAP SEMANAL ──────────────────────────────────────────────── */}
        {weekEntries.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <WeekHeatmap entries={weekEntries} />
          </Animated.View>
        )}

        {/* ── CHECK-IN DE HOY ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).duration(600)} style={s.checkinCard}>
          <LinearGradient colors={['rgba(255,255,255,0.92)', 'rgba(251,248,244,0.78)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={[s.checkinTitle, checkInGuardado && { color: faseConfig.color }]}>
            {dolorTitle}
          </Text>
          <View style={s.dolorRow}>
            {DOLOR_CONFIG.map((d, i) => {
              const sel = dolorLevel === i;
              return (
                <TouchableOpacity key={i} style={s.dolorItem} onPress={() => handleDolorSelect(i)} activeOpacity={0.72}>
                  <View style={[
                    s.dolorCircle,
                    sel
                      ? { backgroundColor: d.color, shadowColor: d.color, shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 }
                      : { backgroundColor: d.color + '1A', borderWidth: 1.5, borderColor: d.color + '50' },
                  ]}>
                    <Ionicons name={d.icon as any} size={22} color={sel ? 'white' : d.color} />
                  </View>
                  <Text style={[s.dolorLabel, { color: sel ? d.color : colorMuted, fontWeight: sel ? '600' : '400' }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Chips zona/síntomas */}
          {dolorLevel !== null && (
            <Animated.View entering={FadeInDown.duration(300)} style={s.checkInExtra}>
              <Text style={s.checkInLabel}>¿DÓNDE?</Text>
              <View style={s.chipsRow}>
                {ZONAS.map(z => {
                  const on = zonasSelec.includes(z.key);
                  return (
                    <TouchableOpacity key={z.key} style={[s.chip, on && { backgroundColor: faseConfig.color, borderColor: faseConfig.color }]} onPress={() => toggleZona(z.key)} activeOpacity={0.75}>
                      <Text style={[s.chipText, on && { color: 'white' }]}>{z.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[s.checkInLabel, { marginTop: 14 }]}>¿QUÉ MÁS SIENTES?</Text>
              <View style={s.chipsRow}>
                {SINTOMAS_RAPIDOS.map(sx => {
                  const on = sintomasSelec.includes(sx.key);
                  return (
                    <TouchableOpacity key={sx.key} style={[s.chip, on && { backgroundColor: faseConfig.color, borderColor: faseConfig.color }]} onPress={() => toggleSintoma(sx.key)} activeOpacity={0.75}>
                      <Text style={[s.chipText, on && { color: 'white' }]}>{sx.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {checkInGuardado && dolorLevel >= 3 && (
                <TouchableOpacity style={s.crisisBtn} onPress={() => router.push('/crisis' as any)} activeOpacity={0.8}>
                  <Ionicons name="heart-outline" size={12} color="#9B5A5A" />
                  <Text style={s.crisisBtnText}>Necesito apoyo ahora</Text>
                  <Ionicons name="chevron-forward" size={10} color="#9B5A5A" />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </Animated.View>

        {/* ── TARJETA ÁGORA ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(260).duration(600)} style={{ marginBottom: 20 }}>
          <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/chat')} style={s.agoraCard}>
            <LinearGradient colors={['rgba(255,255,255,0.88)', 'rgba(251,248,244,0.72)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={[s.agoraAccent, { backgroundColor: faseConfig.color }]} />
            <View style={s.agoraContent}>
              <Text style={[s.agoraTag, { color: faseConfig.color }]}>MENSAJE DE ÁGORA</Text>
              <Text style={s.agoraMessage}>{AGORA_MESSAGES[fase]}</Text>
              <View style={s.agoraCta}>
                <Text style={[s.agoraCtaText, { color: faseConfig.color }]}>Hablar con Ágora</Text>
                <Ionicons name="arrow-forward" size={12} color={faseConfig.color} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── AFIRMACIÓN ───────────────────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(1200).delay(400)} style={s.afirmacion}>
          <Text style={s.afirmacionText}>
            {AFIRMACIONES[new Date().getDay() % AFIRMACIONES.length]}
          </Text>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 120 },

  // Topbar
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  topGreeting: { fontSize: 20, fontWeight: '300', color: colorText, letterSpacing: -0.3, marginBottom: 6 },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devBadge: { backgroundColor: 'rgba(197,160,89,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  devBadgeText: { fontSize: 9, color: colorAccent, fontWeight: '700', letterSpacing: 1 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,90,43,0.12)' },
  streakEmoji: { fontSize: 12 },
  streakNum: { fontSize: 12, fontWeight: '700', color: colorText },
  iconBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(139,90,43,0.1)' },
  fasePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  fasePillText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },

  // Anillo
  ringSection: { alignItems: 'center', paddingVertical: 24 },
  ringWrap: { alignItems: 'center' },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 30, alignItems: 'center', justifyContent: 'center' },
  ringDay: { fontSize: 52, fontWeight: '200', lineHeight: 56 },
  ringDayLabel: { fontSize: 9, color: colorMuted, letterSpacing: 3, fontWeight: '600', marginTop: -4 },
  ringFase: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginTop: 6, textTransform: 'uppercase' },
  ringFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  ringFooterText: { fontSize: 11, color: colorMuted, letterSpacing: 0.2 },

  // Sin datos
  noCycleCard: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 32, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(139,90,43,0.1)', gap: 8, width: width - 40 },
  noCycleTitle: { fontSize: 16, fontWeight: '500', color: colorText },
  noCycleDesc: { fontSize: 12, color: colorMuted, textAlign: 'center', lineHeight: 18 },

  // Predicción
  predCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, borderLeftWidth: 3, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' },
  predLeft:  { width: 28, alignItems: 'center' },
  predBody:  { flex: 1 },
  predEn:    { fontSize: 12, color: colorMuted, marginBottom: 2 },
  predDays:  { fontWeight: '700' },
  predTip:   { fontSize: 12, color: colorText, fontWeight: '300', lineHeight: 17 },

  // Heatmap
  heatmapWrap: { backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' },
  heatmapTitle: { fontSize: 9, color: colorMuted, letterSpacing: 2.5, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  heatmapRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heatmapItem: { alignItems: 'center', gap: 5 },
  heatmapDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  heatmapDay: { fontSize: 9, color: colorMuted, fontWeight: '600', letterSpacing: 0.5 },

  // Check-in
  checkinCard: { borderRadius: 24, overflow: 'hidden', padding: 22, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)' },
  checkinTitle: { fontSize: 13, fontWeight: '300', color: colorText, marginBottom: 20, textAlign: 'center', letterSpacing: 0.2 },
  dolorRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 4 },
  dolorItem: { alignItems: 'center', flex: 1 },
  dolorCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dolorLabel: { fontSize: 9, textAlign: 'center', letterSpacing: 0.2, lineHeight: 12 },

  // Chips
  checkInExtra: { marginTop: 20, paddingHorizontal: 2 },
  checkInLabel: { fontSize: 9, color: colorMuted, letterSpacing: 2.5, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center' },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139,90,43,0.2)', backgroundColor: 'rgba(255,255,255,0.5)' },
  chipText: { fontSize: 12, color: colorSoft },
  crisisBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(155,90,90,0.07)', borderWidth: 1, borderColor: 'rgba(155,90,90,0.18)' },
  crisisBtnText: { fontSize: 11, color: '#9B5A5A', fontWeight: '500' },

  // Tarjeta Ágora
  agoraCard: { borderRadius: 24, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)', shadowColor: colorSoft, shadowOpacity: 0.1, shadowRadius: 18, elevation: 4 },
  agoraAccent: { width: 4 },
  agoraContent: { flex: 1, padding: 20 },
  agoraTag: { fontSize: 8.5, fontWeight: '700', letterSpacing: 2.5, marginBottom: 8 },
  agoraMessage: { fontSize: 14, fontWeight: '300', color: colorText, lineHeight: 22, marginBottom: 14 },
  agoraCta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  agoraCtaText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  // Afirmación
  afirmacion: { alignItems: 'center', paddingHorizontal: 20, marginTop: 4, marginBottom: 20 },
  afirmacionText: { fontSize: 17, fontWeight: '200', color: colorText, textAlign: 'center', lineHeight: 26, letterSpacing: -0.3, opacity: 0.65 },

  // Bloqueada
  blockedTitle: { fontSize: 16, fontWeight: '600', color: colorText, letterSpacing: 3, marginBottom: 12 },
  blockedDesc: { textAlign: 'center', fontSize: 12, color: colorMuted, lineHeight: 19, marginBottom: 30 },
  premiumBtn: { borderRadius: 18, overflow: 'hidden' },
  premiumBtnInner: { paddingVertical: 14, paddingHorizontal: 30 },
  premiumBtnText: { color: 'white', fontWeight: '700', fontSize: 11, letterSpacing: 2 },
});
