import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  ScrollView, Platform
} from 'react-native';
import { getCommunityCount } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, FadeInDown
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import Svg, { Circle, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const colorText   = '#5C3A1E';
const colorAccent = '#C5A059';
const colorSoft   = '#8B5A2B';
const colorMuted  = 'rgba(92,58,30,0.4)';
const colorCard   = 'rgba(255,255,255,0.72)';

const FASE_CONFIG: Record<string, { color: string; icon: string; desc: string }> = {
  MENSTRUAL:   { color: '#C5A059', icon: 'water',                  desc: 'Fase de renovación' },
  FOLICULAR:   { color: '#7AAE8C', icon: 'leaf',                   desc: 'Fase de crecimiento' },
  OVULATORIA:  { color: '#E8A87C', icon: 'flower',                 desc: 'Fase de plenitud' },
  LÚTEA:       { color: '#9B7FB6', icon: 'moon-waning-crescent',   desc: 'Fase introspectiva' },
  PLENITUD:    { color: '#8B5A2B', icon: 'infinity',               desc: 'Etapa de sabiduría' },
  'Sin datos': { color: '#D1C4B2', icon: 'help-circle-outline',    desc: 'Sin registros aún' },
};
const VITALIDAD_CONFIG: Record<string, any> = {
  MENSTRUAL: {
    vitalidad: "CALMA",
    mente: "Introspección",
    subMente: "Tiempo de pausa",
    nutricion: "Hierro y caldos",
    cuerpo: "Estiramientos",
    iconoEnergia: "moon-outline"
  },
  FOLICULAR: {
    vitalidad: "EN ASCENSO",
    mente: "Creatividad",
    subMente: "Nuevos planes",
    nutricion: "Semillas calabaza",
    cuerpo: "Cardio ligero",
    iconoEnergia: "trending-up-outline"
  },
  OVULATORIA: {
    vitalidad: "MÁXIMA",
    mente: "Social",
    subMente: "Poder de expresión",
    nutricion: "Fibra y fruta",
    cuerpo: "Fuerza / HIIT",
    iconoEnergia: "flash-outline"
  },
  LÚTEA: {
    vitalidad: "MODERADA",
    mente: "Detallista",
    subMente: "Organiza tu espacio",
    nutricion: "Magnesio y omega",
    cuerpo: "Yoga / Pilates",
    iconoEnergia: "battery-half-outline"
  },
  'Sin datos': {
    vitalidad: "—",
    mente: "Conócete",
    subMente: "Registra tu ciclo",
    nutricion: "Agua mineral",
    cuerpo: "Caminar",
    iconoEnergia: "help-circle-outline"
  }
};
const TIMER_DURATION = 5400;
const TIMER_KEY      = 'agora_timer_start';
const TIMER_DATE_KEY = 'agora_timer_date';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function calcRemaining(startTs: number): number {
  return Math.max(0, TIMER_DURATION - Math.floor((Date.now() - startTs) / 1000));
}

function CycleArc({ dia, duracion, fase }: { dia: number; duracion: number; fase: string }) {
  const size = 150;
  const sw   = 9;
  const r    = (size - sw) / 2;
  const cx   = size / 2;
  const cy   = size / 2;
  const progress   = duracion > 0 ? Math.min(dia / duracion, 1) : 0;
  const faseColor  = (FASE_CONFIG[fase] || FASE_CONFIG['Sin datos']).color;
  const startAngle = -Math.PI / 2;
  const endAngle   = startAngle + 2 * Math.PI * progress;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = progress > 0.5 ? 1 : 0;
  const arcPath  = progress > 0.01
    ? `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
    : '';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(197,160,89,0.5)" strokeWidth={sw} fill="none" />
        {arcPath !== '' && (
          <View>
            {/* Aura exterior (el resplandor) */}
            <Circle
              cx={x2}
              cy={y2}
              r={6}
              fill={faseColor}
              opacity={0.3}
            />
            {/* Núcleo brillante */}
            <Circle
              cx={x2}
              cy={y2}
              r={3}
              fill="white"
            />
          </View>
        )}
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 38, fontWeight: '200', color: colorText, letterSpacing: -2 }}>
          {dia > 0 ? dia : '—'}
        </Text>
        <Text style={{ fontSize: 9, color: faseColor, fontWeight: '700', letterSpacing: 2 }}>
          {dia > 0 && duracion > 0 ? `DE ${duracion}` : 'DÍA'}
        </Text>
      </View>
    </View>
  );
}

export default function HomeSantuario() {
  const router  = useRouter();
  const devMode = useUserStore((s) => s.devMode);
  const { user, lastGlucosa, lastCiclo, setLastGlucosa, setLastCiclo } = useUserStore();

  const [communityCount, setCommunityCount] = useState<number | null>(null);
  const [communityMsg, setCommunityMsg]     = useState('');
  const [sintomasHoy, setSintomasHoy]       = useState<any[]>([]);
  const [secondsLeft, setSecondsLeft]       = useState(TIMER_DURATION);
  const [isBlocked, setIsBlocked]           = useState(false);

  const fase       = lastCiclo?.fase      ?? 'Sin datos';
  const diaActual  = lastCiclo?.dia_actual ?? 0;
  const duracion   = lastCiclo?.duracion   ?? 28;
  const faseConfig = FASE_CONFIG[fase] || FASE_CONFIG['Sin datos'];
  const vitalidadActual = VITALIDAD_CONFIG[fase] || VITALIDAD_CONFIG['Sin datos'];
  const fetchData = async () => {
    try {
      const data = await getCommunityCount();
      if (data) { setCommunityCount(data.community_size); setCommunityMsg(data.message_es || ''); }
      const statsRes = await api.get('/user/stats');
      if (statsRes.data) { setLastGlucosa(statsRes.data.glucosa); setLastCiclo(statsRes.data.ciclo); }
    } catch (e) { console.error('fetchData:', e); }
  };
  useEffect(() => { fetchData(); }, [user]);

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
    } catch (e) { console.log(e); }
  };
  useEffect(() => { syncTimer(); }, [devMode]);

  const displayMinutes = Math.floor(secondsLeft / 60);
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.07, { duration: 3000 }), withTiming(1, { duration: 3000 })),
      -1, true
    );
  }, []);
  const animatedOrb = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (isBlocked && !devMode) {
    return (
      <View style={s.blockedContainer}>
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

  return (
    <View style={s.container}>
      <LinearGradient colors={['#FBF8F4', '#F2EBE0', '#E8D9C4']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── TOPBAR PERSONALIZADA ── */}
        <View style={s.topbar}>
          <View>
            <Text style={s.greeting}>
              {fase === 'MENSTRUAL' ? 'Buen descanso,' :
                fase === 'LÚTEA' ? 'Paz para ti,' :
                  'Bienvenida,'}
              <Text style={s.userName}> {user?.name?.split(' ')[0] || 'Diosa'}</Text>
            </Text>
            <Text style={s.brand}>ÁGORA</Text>
          </View>

          <View style={s.topbarRight}>
            {devMode ? (
              <View style={s.devBadge}><Text style={s.devBadgeText}>∞ DEV</Text></View>
            ) : (
              <View style={s.timerBadge}>
                <Ionicons name="time-outline" size={11} color={colorAccent} />
                <Text style={s.timerText}>{displayMinutes} min</Text>
              </View>
            )}
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => router.push('/medical-report')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={17} color={colorSoft} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── COMUNIDAD ── */}
        {communityCount !== null && (
          <Animated.View entering={FadeInDown.delay(80)} style={s.communityBanner}>
            <MaterialCommunityIcons name="account-group-outline" size={13} color={colorAccent} />
            <Text style={s.communityText}>{communityMsg}</Text>
          </Animated.View>
        )}

        {/* ── CICLO HORMONAL ── tarjeta protagonista (CORREGIDA) ── */}
        <Animated.View entering={FadeInDown.delay(140)} style={s.cicloCard}>
          {/* Fondo Glassmorphism suave (sin el degradado invasivo) */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 32 }]} />

          <View style={s.cicloHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionLabel}>MI ESTADO ACTUAL</Text>
              <Text style={[s.faseTitle, { color: faseConfig.color }]}>{fase}</Text>
              <Text style={s.faseDesc}>{faseConfig.desc}</Text>
            </View>
            <View style={[s.faseIconBadge, { backgroundColor: faseConfig.color + '1A' }]}>
              <MaterialCommunityIcons name={faseConfig.icon as any} size={22} color={faseConfig.color} />
            </View>
          </View>

          <View style={s.cicloBody}>
            {/* El Arco a la izquierda con más aire */}
            <CycleArc dia={diaActual} duracion={duracion} fase={fase} />

            {/* Datos limpios y flotantes a la derecha (SIN ISLA GRIS) */}
            <View style={s.cicloMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaValue}>{duracion > 0 ? duracion : '—'}</Text>
                <Text style={s.metaLabel}>DÍAS{"\n"}CICLO</Text>
              </View>

              <View style={s.metaDivider} />

              <View style={s.metaItem}>
                <Text style={s.metaValue}>
                  {diaActual > 0 && duracion > 0 ? duracion - diaActual : '—'}
                </Text>
                <Text style={s.metaLabel}>DÍAS{"\n"}REST.</Text>
              </View>

              <View style={s.metaDivider} />

              <View style={s.metaItem}>
                <Text style={[s.metaValue, { color: faseConfig.color }]}>
                  {diaActual > 0 ? Math.round((diaActual / duracion) * 100) + '%' : '—'}
                </Text>
                <Text style={s.metaLabel}>PROGRE-{"\n"}SO</Text>
              </View>
            </View>
          </View>

          {/* Botón CTA más sutil */}
          <TouchableOpacity style={s.cicloCta} onPress={() => router.push('/ciclo')}>
            <Text style={s.cicloCtaText}>GESTIONAR MI CALENDARIO</Text>
            <Ionicons name="chevron-forward" size={11} color={colorAccent} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── FILA MÉTRICAS + ORBE ── */}
        <Animated.View entering={FadeInDown.delay(220)} style={s.metricsRow}>

          {/* Glucosa */}
          {/* Tarjeta Glucosa con Botón Añadir */}
          <TouchableOpacity
            style={s.smallCard}
            onPress={() => router.push('/glucosa')}
            activeOpacity={0.8}
          >
            {/* Botón flotante de añadir (+) */}
            <TouchableOpacity
              style={s.addMetricBtn}
              onPress={() => router.push('/glucosa')} // Aquí podrías abrir directamente un modal de registro
            >
              <Ionicons name="add" size={14} color="white" />
            </TouchableOpacity>

            <View style={[s.smallIcon, { backgroundColor: faseConfig.color + '1A' }]}>
              <MaterialCommunityIcons name="water-outline" size={18} color={faseConfig.color} />
            </View>

            <Text style={s.smallValue}>{lastGlucosa?.valor > 0 ? lastGlucosa.valor : '—'}</Text>
            <Text style={s.smallUnit}>MG/DL</Text>
            <Text style={s.smallLabel}>GLUCOSA</Text>
          </TouchableOpacity>

          {/* Orbe Ágora con Efecto Aura */}
          <View style={s.orbCol}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/chat')}>
              <View style={s.orbWrapper}>
                {/* Círculo de resplandor (Aura) */}
                <Animated.View style={[s.orbAura, animatedOrb, { backgroundColor: faseConfig.color }]} />
                {/* El Orbe Principal */}
                {/* ── ORBE ÁGORA DINÁMICO ── */}
                <Animated.View style={[s.orb, animatedOrb]}>
                  <LinearGradient
                    // Usamos el color de la fase y lo mezclamos con el colorAccent para mantener la marca
                    colors={[faseConfig.color, colorAccent]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 33 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Ionicons name="mic-outline" size={28} color="white" />
                </Animated.View>
              </View>
            </TouchableOpacity>
            <Text style={s.orbLabel}>ÁGORA</Text>
          </View>

          {/* Síntomas */}
          <TouchableOpacity
            style={s.smallCard}
            onPress={() => router.push('/sintomas-cronico')}
            activeOpacity={0.8}
          >
            {/* Botón flotante de añadir (+) igual que en glucosa */}
            <View style={s.addMetricBtn}>
              <Ionicons name="add" size={14} color="white" />
            </View>

            <View style={[s.smallIcon, { backgroundColor: '#9B7FB61A' }]}>
              <MaterialCommunityIcons name="leaf" size={18} color="#9B7FB6" />
            </View>
            <Text style={s.smallValue}>{sintomasHoy.length > 0 ? sintomasHoy.length : '—'}</Text>
            <Text style={s.smallUnit}>HOY</Text>
            <Text style={s.smallLabel}>SÍNTOMAS</Text>
          </TouchableOpacity>

        </Animated.View>

        {/* ── SECCIÓN DE ESTADO Y VITALIDAD (DINÁMICA) ── */}
        <Animated.View entering={FadeInDown.delay(280)} style={s.statusCard}>
          <View style={s.statusHeader}>
            <Text style={s.sectionLabel}>ESTADO DE VITALIDAD</Text>
            <View style={s.energyBadge}>
              <Ionicons name={vitalidadActual.iconoEnergia} size={10} color="#C5A059" />
              <Text style={s.energyText}>{vitalidadActual.vitalidad}</Text>
            </View>
          </View>

          <View style={s.statusGrid}>
            {/* Columna Mente */}
            <View style={s.statusItem}>
              <MaterialCommunityIcons name="brain" size={20} color={colorSoft} />
              <Text style={s.statusValue}>{vitalidadActual.mente}</Text>
              <Text style={s.statusSub}>{vitalidadActual.subMente}</Text>
            </View>

            <View style={s.statusDivider} />

            {/* Columna Nutrición */}
            <View style={s.statusItem}>
              <MaterialCommunityIcons name="silverware-variant" size={20} color={colorSoft} />
              <Text style={s.statusValue}>Nutrición</Text>
              <Text style={s.statusSub}>{vitalidadActual.nutricion}</Text>
            </View>

            <View style={s.statusDivider} />

            {/* Columna Deporte */}
            <View style={s.statusItem}>
              <MaterialCommunityIcons name="run" size={20} color={colorSoft} />
              <Text style={s.statusValue}>Cuerpo</Text>
              <Text style={s.statusSub}>{vitalidadActual.cuerpo}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── DIARIO ── */}
        <Animated.View entering={FadeInDown.delay(320)}>
          <TouchableOpacity style={s.diaryBtn} onPress={() => router.push('/diario')}>
            <LinearGradient
              colors={['rgba(255,255,255,0.55)', 'rgba(255,248,236,0.3)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
            />
            <Ionicons name="book-outline" size={17} color={colorSoft} />
            <Text style={s.diaryText}>DIARIO PERSONAL</Text>
            <Ionicons name="chevron-forward" size={13} color={colorMuted} />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 120 },

  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  greeting: { fontSize: 11, color: colorMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  brand: { fontSize: 28, fontWeight: '200', color: colorText, letterSpacing: 10, marginTop: -4 },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(197,160,89,0.1)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 18 },
  timerText: { fontSize: 10, color: colorAccent, fontWeight: '600' },
  devBadge: { backgroundColor: 'rgba(197,160,89,0.12)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 18 },
  devBadgeText: { fontSize: 10, color: colorAccent, fontWeight: '700', letterSpacing: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(139,90,43,0.1)' },

  communityBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(197,160,89,0.07)', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(197,160,89,0.14)' },
  communityText: { fontSize: 11, color: colorSoft, fontWeight: '500', flex: 1 },

  cicloCard: { 
    borderRadius: 32, 
    padding: 22, // Un poco más de padding interno
    marginBottom: 16, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.8)', // Borde blanco suave
    shadowColor: colorSoft, 
    shadowOpacity: 0.05, 
    shadowRadius: 15, 
    elevation: 3 
  },
  cicloHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  sectionLabel: { fontSize: 8.5, color: colorMuted, letterSpacing: 4, fontWeight: '500', marginBottom: 8, textTransform: 'uppercase', opacity: 0.7 },
  faseTitle: { fontSize: 22, fontWeight: '200', letterSpacing: 3, textTransform: 'uppercase' },
  faseDesc: { fontSize: 10, color: colorMuted, marginTop: 1 },
  faseIconBadge: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cicloBody: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginVertical: 15, // Más aire arriba y abajo
  },
  cicloMeta: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-around', 
    paddingLeft: 20, // Aumentamos de 10 a 20 para alejarlo del arco
    paddingRight: 5, // Un poco de margen derecho
  },
  metaItem: { alignItems: 'center' },
  metaValue: { 
    fontSize: 20, // Volvemos al tamaño original, es más legible
    fontWeight: '200', 
    color: colorText, 
    letterSpacing: -0.5 
  },
  metaLabel: { 
    fontSize: 7, 
    color: colorMuted, 
    fontWeight: '700', 
    letterSpacing: 1.2, 
    marginTop: 4, 
    textAlign: 'center', 
    lineHeight: 9,
    opacity: 0.6 // Un poco más discreto para que el número resalte
  },
  metaDivider: { 
    width: 1, 
    height: 24, 
    backgroundColor: 'rgba(139, 90, 43, 0.05)' // Casi invisible, una sombra de línea
  },
  cicloCta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    paddingVertical: 12, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: 'rgba(197, 160, 89, 0.15)', 
    backgroundColor: 'rgba(255, 255, 255, 0.4)' 
  },
  cicloCtaText: { 
    fontSize: 9, 
    color: colorAccent, 
    fontWeight: '700', 
    letterSpacing: 2.5 
  },

  metricsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  smallCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 30, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', shadowColor: '#8B5A2B', shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 },
  smallIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  smallValue: { 
    fontSize: 26, 
    fontWeight: '200', 
    color: colorText, 
    letterSpacing: -1,
    marginTop: 8, // Aumentamos de 4 a 8
  },
  smallUnit: { fontSize: 7.5, color: colorMuted, letterSpacing: 2, fontWeight: '700' },
  smallLabel: { fontSize: 7.5, color: colorMuted, letterSpacing: 2, fontWeight: '700', marginTop: 6 },
  badge: { marginTop: 7, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9 },
  badgeText: { fontSize: 7.5, fontWeight: '800', letterSpacing: 1 },

  orbCol: { alignItems: 'center', gap: 7 },
  orb: {width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: colorAccent, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  orbLabel: { fontSize: 7.5, color: colorMuted, letterSpacing: 3, fontWeight: '700' },
  orbWrapper: { alignItems: 'center', justifyContent: 'center', width: 80, height: 80, },
  orbAura: { position: 'absolute', width: 75, height: 75, borderRadius: 40, backgroundColor: colorAccent, opacity: 0.2, },
  symptomsCard: { backgroundColor: colorCard, borderRadius: 26, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', shadowColor: colorSoft, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  symptomsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  addBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: colorSoft, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 10, gap: 5 },
  emptyTitle: { fontSize: 13, color: colorText, fontWeight: '300' },
  emptyDesc: { fontSize: 10.5, color: colorMuted, textAlign: 'center', lineHeight: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: 'rgba(197,160,89,0.09)', paddingHorizontal: 13, paddingVertical: 5, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(197,160,89,0.18)' },
  chipText: { fontSize: 11.5, color: colorSoft, fontWeight: '500' },

  diaryBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 26, 
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Más transparente
    borderWidth: 0,
    shadowColor: colorSoft,
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
    marginBottom: 40 // Espacio extra para que no choque con los Tabs
  },
  diaryText: { flex: 1, fontSize: 10, fontWeight: '700', color: colorSoft, letterSpacing: 2, marginLeft: 11 },

  blockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  blockedTitle: { fontSize: 16, fontWeight: '600', color: colorText, letterSpacing: 3, marginBottom: 12 },
  blockedDesc: { textAlign: 'center', fontSize: 12, color: colorMuted, lineHeight: 19, marginBottom: 30 },
  premiumBtn: { borderRadius: 18, overflow: 'hidden' },
  premiumBtnInner: { paddingVertical: 14, paddingHorizontal: 30 },
  premiumBtnText: { color: 'white', fontWeight: '700', fontSize: 11, letterSpacing: 2 },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.6)', 
    borderRadius: 32,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#8B5A2B',
    shadowOpacity: 0.04,
    shadowRadius: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197,160,89,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  energyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C5A059',
    letterSpacing: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statusValue: {
    fontSize: 13, // Un pelín más grande
    fontWeight: '600',
    color: colorText,
    marginTop: 2,
  },
  statusSub: {
    fontSize: 9,
    color: colorSoft, // Cambiamos de muted a soft para que se lea mejor
    opacity: 0.7,
    textAlign: 'center',
  },
  statusDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(139,90,43,0.1)',
  },
  userName: {
    color: colorSoft, // Color madera/tierra para el nombre
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'none', // El nombre se ve mejor en formato normal
  },
 addMetricBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 20, // Un pelín más pequeño para que sea más fino
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 90, 43, 0.2)', // Color tierra suave para que no "grite"
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});