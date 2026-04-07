/**
 * home.tsx — Agora Mujeres · Rediseno completo
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Platform, Modal, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/useStore';
import {
  getSubscriptionStatus, getDiaryEntries,
  createPaymentIntent, activateSubscription, createCustomer,
  type SubscriptionStatus,
} from '../../src/services/api';

const C = {
  forest: '#4A664D', forestDim: '#3A5140', forestDeep: '#2C3D2E',
  moss: '#6B8F6E', sage: '#A8C5A0',
  mint: '#D4E8D0', mintSoft: '#EAF4E8', cream: '#F8F7F2', parchment: '#F0EDE4',
  warm: '#E8E2D8', muted: '#9A958E', charcoal: '#3D3A35', white: '#FFFFFF',
  gold: '#C9A84C', amber: '#D4853A',
};

const QUOTES = [
  'Hoy no tienes que poder con todo. Solo con este momento.',
  'Tu cuerpo hace lo mejor que puede. Merece tu ternura.',
  'Pequeños pasos siguen siendo movimiento hacia adelante.',
  'Escucharte es un acto de amor hacia ti misma.',
  'La calma también es una forma de fortaleza.',
  'No estás sola en esto. Agora siempre está aquí.',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
function fmt(s: number) {
  if (s <= 0) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m} min`;
}
function painColor(v: number) { return v <= 3 ? '#7BAF7E' : v <= 6 ? '#D4A96A' : '#C07A5A'; }
function useWidth() {
  const [w, setW] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setW(window.width));
    return () => sub?.remove();
  }, []);
  return w;
}
function FadeIn({ delay = 0, children }: any) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}
function Pulse({ color }: { color: string }) {
  const sc = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sc, { toValue: 1.8, duration: 2000, useNativeDriver: true }),
      Animated.timing(sc, { toValue: 1, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, transform: [{ scale: sc }] }} />;
}
function Press({ onPress, style, children }: any) {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[style, { transform: [{ scale: sc }] }]}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
        onPress={onPress} activeOpacity={1}
      >{children}</TouchableOpacity>
    </Animated.View>
  );
}

function TrialWarningBanner({ visible, urgent, onSubscribe, onDismiss, insetTop }: any) {
  const y = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (visible) {
      Animated.spring(y, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }).start();
      timerRef.current = setTimeout(() => {
        Animated.timing(y, { toValue: -120, duration: 400, useNativeDriver: true }).start(() => onDismiss());
      }, 8000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      y.setValue(-120);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[s.warningBanner, {
      top: insetTop + 8,
      backgroundColor: urgent ? C.amber : C.forest,
      transform: [{ translateY: y }],
    }]}>
      <View style={s.warningIconBox}>
        <Ionicons name={urgent ? 'time-outline' : 'leaf-outline'} size={16} color={C.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.warningTitle}>{urgent ? 'Quedan 5 minutos' : 'Quedan 10 minutos'}</Text>
        <Text style={s.warningBody}>{urgent ? 'Tu tiempo de prueba está a punto de terminar.' : 'Tu acceso libre está llegando a su fin.'}</Text>
      </View>
      <TouchableOpacity onPress={onSubscribe} style={s.warningBtn}>
        <Text style={s.warningBtnText}>Ver planes</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} style={{ padding: 6 }}>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

function TrialModal({ visible, onPlans, onClose }: any) {
  const sl = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    if (visible) Animated.spring(sl, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }).start();
    else sl.setValue(300);
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, { transform: [{ translateY: sl }] }]}>
          <View style={s.sheetIconBox}>
            <Ionicons name="leaf-outline" size={28} color={C.forest} />
          </View>
          <Text style={s.sheetTitle}>Tu tiempo de prueba{'\n'}ha terminado</Text>
          <Text style={s.sheetBody}>Agora ha estado contigo durante este tiempo.{'\n'}Si quieres que siga acompañándote,{'\n'}estamos aquí cuando estés lista.</Text>
          <Press onPress={onPlans} style={{ width: '100%' }}>
            <LinearGradient colors={[C.forestDeep, C.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sheetBtn}>
              <Text style={s.sheetBtnText}>Ver planes de acompañamiento</Text>
            </LinearGradient>
          </Press>
          <TouchableOpacity onPress={onClose} style={{ paddingVertical: 10 }}>
            <Text style={{ fontSize: 13, color: C.muted }}>Ahora no, gracias</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function PlansModal({ visible, onSubscribe, onClose }: any) {
  const sl = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    if (visible) Animated.spring(sl, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }).start();
    else sl.setValue(400);
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, s.plansSheet, { transform: [{ translateY: sl }] }]}>
          <Text style={s.plansTitle}>Quedarte con Agora</Text>
          <Text style={s.plansBody}>Sin urgencia, sin presion. Aqui cuando la necesites.</Text>
          <Press onPress={() => onSubscribe('monthly')} style={{ width: '100%' }}>
            <View style={s.planRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.planName}>Mensual</Text>
                <Text style={s.planDesc}>Acceso completo · cancela cuando quieras</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.planPrice}>7,90 €</Text>
                <Text style={s.planPer}>/mes</Text>
              </View>
            </View>
          </Press>
          <Press onPress={() => onSubscribe('yearly')} style={{ width: '100%' }}>
            <LinearGradient colors={[C.forestDim, C.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.planRow, { borderColor: 'transparent' }]}>
              <View style={s.planYearBadge}><Text style={s.planYearBadgeText}>2 meses gratis</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.planName, { color: C.white }]}>Anual</Text>
                <Text style={[s.planDesc, { color: C.sage }]}>Todo incluido · acceso prioritario</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.planPrice, { color: C.white }]}>79.90 €</Text>
                <Text style={[s.planPer, { color: C.sage }]}>/año</Text>
              </View>
            </LinearGradient>
          </Press>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <Ionicons name="lock-closed-outline" size={12} color={C.muted} />
            <Text style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>Pago seguro · Sin compromisos</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ paddingVertical: 8 }}>
            <Text style={{ fontSize: 13, color: C.muted }}>Ahora no</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenW = useWidth();
  const isDesktop = screenW >= 768;
  const { userData, deviceId, contador } = useUserStore();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [secs, setSecs] = useState(0);
  const [lastEntry, setLast] = useState<any>(null);
  const [showTrial, setTrial] = useState(false);
  const [showPlans, setPlans] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [warn10, setWarn10] = useState(false);
  const [warn5, setWarn5] = useState(false);
  const [showCycle, setShowCycle] = useState(false);
  const [cycleData, setCycleData] = useState<any>(null);
  const [cycleForm, setCycleForm] = useState({ phase: 'menstruation', pain: 0, symptoms: [] as string[], mood: '' });
  const warned10Ref = useRef(false);
  const warned5Ref = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const name = userData?.name?.split(' ')[0] || 'tú';
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const STORAGE_KEY = `agora_trial_secs_${deviceId}`;
  const STORAGE_TS = `agora_trial_ts_${deviceId}`;

  const loadSub = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await getSubscriptionStatus(deviceId);
      setSub(data);
      let rem = data.trial_remaining_seconds ?? 0;
      const savedSecs = localStorage.getItem(STORAGE_KEY);
      const savedTs = localStorage.getItem(STORAGE_TS);
      if (savedSecs && savedTs && data.status === 'trial') {
        const elapsed = Math.floor((Date.now() - parseInt(savedTs)) / 1000);
        rem = Math.max(0, parseInt(savedSecs) - elapsed);
      } else {
        localStorage.setItem(STORAGE_KEY, String(rem));
        localStorage.setItem(STORAGE_TS, String(Date.now()));
      }
      setSecs(rem);
      if (data.status === 'expired') { setPlans(true); return; }
      if (data.status === 'trial' && rem <= 0) { setTrial(true); }
    } catch { }
  }, [deviceId]);

  useEffect(() => {
    loadSub();
    if (deviceId) getDiaryEntries(deviceId, 1).then(e => e.length && setLast(e[0])).catch(() => { });
    if (deviceId && typeof window !== 'undefined') {
      const saved = localStorage.getItem('agora-cycle-' + deviceId);
      if (saved) try { setCycleData(JSON.parse(saved)); } catch {}
    }
  }, [deviceId]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!sub || secs <= 0) return;
    tickRef.current = setInterval(() => {
      setSecs(prev => {
        const next = Math.max(0, prev - 1);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, String(next));
          localStorage.setItem(STORAGE_TS, String(Date.now()));
        }
        if (next <= 600 && next > 599 && sub.status === 'trial' && !warned10Ref.current) {
          warned10Ref.current = true; setWarn10(true);
        }
        if (next <= 300 && next > 299 && sub.status === 'trial' && !warned5Ref.current) {
          warned5Ref.current = true; setWarn10(false); setWarn5(true);
        }
        if (next === 0) {
          clearInterval(tickRef.current!);
          setWarn10(false); setWarn5(false);
          if (sub.status === 'trial') setTrial(true);
          if (sub.status === 'active') setPlans(true);
        }
        return next;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [sub]);

  const doPurchase = async (plan: string) => {
    if (!deviceId) return;
    setBuying(plan);
    try {
      if (userData?.email) await createCustomer(deviceId, userData.email, userData.name).catch(() => { });
      const intent = await createPaymentIntent(deviceId);
      await activateSubscription(deviceId, intent.payment_intent_id || intent.id);
      setTrial(false); setPlans(false);
      await loadSub();
    } catch { } finally { setBuying(null); }
  };

  const trialLabel =
    sub?.status === 'active' && secs > 0
      ? { text: fmt(secs), sub: 'de tu día de calma', color: C.gold }
      : sub?.status === 'trial' && secs > 0
        ? { text: fmt(secs), sub: 'de acceso libre', color: C.sage }
        : null;

  const CYCLE_PHASES = [
    { key: 'menstruation', label: 'Menstruación', color: '#C0614A', bg: '#FEF2F2', icon: 'water-outline' },
    { key: 'follicular', label: 'Folicular', color: '#4A7FA5', bg: '#EEF4FA', icon: 'sunny-outline' },
    { key: 'ovulation', label: 'Ovulación', color: C.forest, bg: C.mintSoft, icon: 'flower-outline' },
    { key: 'luteal', label: 'Lútea', color: C.gold, bg: '#FDF8EE', icon: 'moon-outline' },
  ];
  const CYCLE_SYMPTOMS = ['hinchazón', 'náuseas', 'fatiga', 'migraña', 'irritabilidad', 'insomnio', 'calambres', 'sensibilidad'];
  const CYCLE_MOODS = ['tranquila', 'triste', 'irritable', 'agotada', 'ansiosa', 'bien'];
  const lastCycleEntry = cycleData?.entries?.[cycleData.entries.length - 1];
  const currentPhase = CYCLE_PHASES.find(p => p.key === (lastCycleEntry?.phase || 'menstruation')) || CYCLE_PHASES[0];

  const saveCycle = () => {
    const key = deviceId ? 'agora-cycle-' + deviceId : 'agora-cycle-guest';
    const entry = { ...cycleForm, date: new Date().toISOString() };
    const updated = { entries: [...(cycleData?.entries || []), entry] };
    setCycleData(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch(e) { console.error('cycle save error', e); }
    }
    setShowCycle(false);
    setCycleForm({ phase: 'menstruation', pain: 0, symptoms: [], mood: '' });
  };

  // Bloques reutilizables
  const QuoteBlock = (
    <FadeIn delay={60}>
      <View style={s.quoteCard}>
        <Text style={s.qMark}>"</Text>
        <Text style={s.qText}>{quote}</Text>
        <View style={s.qDivider} />
        <Text style={s.qLabel}>Reflexión del día</Text>
      </View>
    </FadeIn>
  );

  const DiaryBlock = (
    <FadeIn delay={120}>
      <Press onPress={() => router.push('/diary/new')}>
        <LinearGradient colors={[C.forestDeep, C.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.diaryCard}>
          <View style={s.diaryIconBox}>
            <Ionicons name="book-outline" size={22} color={C.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.diaryTitle}>{'¿Cómo te sientes hoy?'}</Text>
            <Text style={s.diarySub}>
              {lastEntry
                ? `Última vez: ${new Date(lastEntry.created_at).toLocaleDateString('es-ES', { weekday: 'long' })}`
                : 'Cuéntamelo con calma'}
            </Text>
          </View>
          <View style={s.diaryArrow}>
            <Ionicons name="arrow-forward" size={18} color={C.white} />
          </View>
        </LinearGradient>
      </Press>
    </FadeIn>
  );

  const StreakBlock = (
    <FadeIn delay={180}>
      <View style={s.streakCard}>
        <View style={s.streakNumBox}>
          <Text style={s.streakNum}>{contador}</Text>
          <Text style={s.streakUnit}>días</Text>
        </View>
        <View style={s.streakDivider} />
        <Text style={s.streakMsg}>
          {contador > 0 ? `Llevas ${contador} ${contador === 1 ? 'día' : 'días'} escuchándote. Eso importa.` : 'Hoy es un buen día para empezar.'}
        </Text>
      </View>
    </FadeIn>
  );

  const CountdownBlock = trialLabel && sub?.status === 'trial' ? (
    <FadeIn delay={80}>
      <View style={s.countdownCard}>
        <View style={s.countdownTop}>
          <Text style={s.countdownEyebrow}>Acceso libre</Text>
          <TouchableOpacity onPress={() => setPlans(true)} style={s.countdownBtn}>
            <Text style={s.countdownBtnText}>Ver planes</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.countdownTime}>{trialLabel.text}</Text>
        <Text style={s.countdownSub}>restantes para explorar Agora</Text>
        <View style={s.countdownBar}>
          <View style={[s.countdownFill, { width: `${Math.min(100, (secs / 5400) * 100)}%` as any }]} />
        </View>
      </View>
    </FadeIn>
  ) : null;

  const SOSBlock = (
    <FadeIn delay={140}>
      <Press onPress={() => router.push('/crisis')}>
        <View style={s.sosCard}>
          <View style={s.sosIconBox}>
            <Ionicons name="heart-outline" size={22} color={'#C0614A'} />
          </View>
          <Text style={s.sosTitle}>Mis recursos</Text>
          <Text style={s.sosSub}>Guia y apoyo</Text>
        </View>
      </Press>
    </FadeIn>
  );

  const PatternsBlock = (
    <FadeIn delay={160}>
      <Press onPress={() => router.push('/(tabs)/patterns')}>
        <View style={s.patternsCard}>
          <View style={s.patternsIconBox}>
            <Ionicons name="analytics-outline" size={22} color={C.moss} />
          </View>
          <Text style={s.patternsTitle}>Mis Patrones</Text>
          <Text style={s.patternsSub}>Entenderme mejor</Text>
        </View>
      </Press>
    </FadeIn>
  );

  const CycleBlock = (
    <FadeIn delay={170}>
      <Press onPress={() => setShowCycle(true)}>
        <View style={s.cycleCard}>
          <View style={[s.cycleIconBox, { backgroundColor: currentPhase.bg }]}>
            <Ionicons name={currentPhase.icon as any} size={20} color={currentPhase.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cycleTitle}>Mi ciclo</Text>
            <Text style={s.cycleSub}>
              {lastCycleEntry
                ? currentPhase.label + ' · ' + new Date(lastCycleEntry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : 'Registra tu primer día'}
            </Text>
          </View>
          <View style={s.cycleArrow}>
            <Ionicons name="add" size={18} color={C.forest} />
          </View>
        </View>
      </Press>
    </FadeIn>
  );

  const LastEntryBlock = lastEntry ? (
    <FadeIn delay={200}>
      <Press onPress={() => router.push('/(tabs)/diary')}>
        <View style={s.entryCard}>
          <View style={s.entryTop}>
            <Text style={s.entryDate}>
              {new Date(lastEntry.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            {(lastEntry.dolor ?? 0) > 0 && (
              <View style={[s.painBadge, { backgroundColor: painColor(lastEntry.dolor) + '22' }]}>
                <View style={[s.painDot, { backgroundColor: painColor(lastEntry.dolor) }]} />
                <Text style={[s.painText, { color: painColor(lastEntry.dolor) }]}>{lastEntry.dolor}/10</Text>
              </View>
            )}
          </View>
          <Text style={s.entryBody} numberOfLines={3}>
            {lastEntry.texto
              ? lastEntry.texto
              : [...(lastEntry.cuerpo || []), ...(lastEntry.mente || []), ...(lastEntry.alma || [])].slice(0, 4).join(' · ')}
          </Text>
        </View>
      </Press>
    </FadeIn>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[C.forestDeep, C.forest]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 18 }]}
      >
        <View style={s.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{getGreeting()},</Text>
            <Text style={s.name}>{name}.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={s.avatarBtn}>
            <Ionicons name="person-circle-outline" size={36} color={'rgba(168,197,160,0.8)'} />
          </TouchableOpacity>
        </View>
        {trialLabel && (
          <View style={s.trialPill}>
            <Pulse color={trialLabel.color} />
            <Text style={s.trialTime}>{trialLabel.text}</Text>
            <Text style={s.trialSep}>·</Text>
            <Text style={s.trialSub}>{trialLabel.sub}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[s.page, { paddingBottom: insets.bottom + 100 }]}>
          {isDesktop ? (
            <View style={s.grid}>
              <View style={s.colLeft}>
                {QuoteBlock}
                {DiaryBlock}
                {StreakBlock}
                {LastEntryBlock}
              </View>
              <View style={s.colRight}>
                {CountdownBlock}
                {SOSBlock}
                {PatternsBlock}
                {CycleBlock}
              </View>
            </View>
          ) : (
            <View style={s.stack}>
              {QuoteBlock}
              {CountdownBlock}
              {DiaryBlock}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>{SOSBlock}</View>
                <View style={{ flex: 1 }}>{PatternsBlock}</View>
              </View>
              {CycleBlock}
              {LastEntryBlock}
              {StreakBlock}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal ciclo */}
      <Modal visible={showCycle} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.sheet, { maxHeight: '88%' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={[s.sheetTitle, { textAlign: 'left', fontSize: 20 }]}>Registrar hoy</Text>
              <TouchableOpacity onPress={() => setShowCycle(false)}>
                <Ionicons name="close" size={22} color={C.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.cycleModalLabel}>Fase del ciclo</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {CYCLE_PHASES.map(p => (
                  <TouchableOpacity key={p.key} onPress={() => setCycleForm(f => ({ ...f, phase: p.key }))}
                    style={[s.cycleChip, { backgroundColor: cycleForm.phase === p.key ? p.bg : C.parchment, borderColor: cycleForm.phase === p.key ? p.color : C.warm }]}>
                    <Text style={[s.cycleChipText, { color: cycleForm.phase === p.key ? p.color : C.muted }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.cycleModalLabel}>Intensidad del dolor (0-5)</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {[0,1,2,3,4,5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setCycleForm(f => ({ ...f, pain: n }))}
                    style={[s.painDotBtn, { backgroundColor: cycleForm.pain === n ? C.forest : C.parchment, borderColor: cycleForm.pain === n ? C.forest : C.warm }]}>
                    <Text style={[s.painDotBtnText, { color: cycleForm.pain === n ? C.white : C.muted }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.cycleModalLabel}>Síntomas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {CYCLE_SYMPTOMS.map(sym => {
                  const active = cycleForm.symptoms.includes(sym);
                  return (
                    <TouchableOpacity key={sym} onPress={() => setCycleForm(f => ({
                      ...f, symptoms: active ? f.symptoms.filter(x => x !== sym) : [...f.symptoms, sym]
                    }))} style={[s.cycleChip, { backgroundColor: active ? C.mintSoft : C.parchment, borderColor: active ? C.forest : C.warm }]}>
                      <Text style={[s.cycleChipText, { color: active ? C.forest : C.muted }]}>{sym}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={s.cycleModalLabel}>Estado de ánimo</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {CYCLE_MOODS.map(m => {
                  const active = cycleForm.mood === m;
                  return (
                    <TouchableOpacity key={m} onPress={() => setCycleForm(f => ({ ...f, mood: m }))}
                      style={[s.cycleChip, { backgroundColor: active ? C.mintSoft : C.parchment, borderColor: active ? C.forest : C.warm }]}>
                      <Text style={[s.cycleChipText, { color: active ? C.forest : C.muted }]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={saveCycle} style={s.cycleSaveBtn}>
                <Text style={s.cycleSaveBtnText}>Guardar registro</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TrialWarningBanner visible={warn10} urgent={false} insetTop={insets.top}
        onSubscribe={() => { setWarn10(false); setPlans(true); }} onDismiss={() => setWarn10(false)} />
      <TrialWarningBanner visible={warn5} urgent={true} insetTop={insets.top}
        onSubscribe={() => { setWarn5(false); setPlans(true); }} onDismiss={() => setWarn5(false)} />
      <TrialModal visible={showTrial} onPlans={() => { setTrial(false); setPlans(true); }} onClose={() => setTrial(false)} />
      <PlansModal visible={showPlans} onSubscribe={doPurchase} onClose={() => setPlans(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingBottom: 22 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  greeting: { color: 'rgba(168,197,160,0.85)', fontSize: 14, fontWeight: '400', letterSpacing: 0.3 },
  name: { color: C.white, fontSize: 28, fontWeight: '300', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginTop: 2 },
  avatarBtn: { padding: 4 },
  trialPill: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' },
  trialTime: { color: C.white, fontSize: 13, fontWeight: '600' },
  trialSep: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  trialSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  page: { padding: 18, paddingTop: 20 },
  grid: { flexDirection: 'row', gap: 16, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  colLeft: { flex: 1.2, gap: 14 },
  colRight: { flex: 0.8, gap: 14 },
  stack: { gap: 14 },
  quoteCard: { backgroundColor: C.white, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: C.warm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  qMark: { fontSize: 42, color: C.mint, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 44, marginBottom: 4 },
  qText: { fontSize: 16, color: C.charcoal, lineHeight: 26, fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  qDivider: { height: 1, backgroundColor: C.warm, marginVertical: 14 },
  qLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 2.5, fontWeight: '600' },
  diaryCard: { borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: C.forestDeep, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 5 },
  diaryIconBox: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  diaryTitle: { color: C.white, fontSize: 17, fontWeight: '600', marginBottom: 4 },
  diarySub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  diaryArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  streakCard: { backgroundColor: C.white, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: C.warm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  streakNumBox: { alignItems: 'center', minWidth: 48 },
  streakNum: { fontSize: 32, fontWeight: '700', color: C.forest, lineHeight: 36 },
  streakUnit: { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  streakDivider: { width: 1, height: 40, backgroundColor: C.warm },
  streakMsg: { flex: 1, fontSize: 14, color: C.charcoal, lineHeight: 21 },
  countdownCard: { backgroundColor: C.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.warm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  countdownTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  countdownEyebrow: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 2.5, fontWeight: '600' },
  countdownBtn: { backgroundColor: C.mintSoft, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  countdownBtnText: { fontSize: 11, color: C.forest, fontWeight: '600' },
  countdownTime: { fontSize: 34, fontWeight: '700', color: C.forest, lineHeight: 38 },
  countdownSub: { fontSize: 12, color: C.muted, marginBottom: 12 },
  countdownBar: { height: 6, backgroundColor: C.mintSoft, borderRadius: 3, overflow: 'hidden' },
  countdownFill: { height: '100%', backgroundColor: C.forest, borderRadius: 3 },
  sosCard: { backgroundColor: C.white, borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: C.warm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sosIconBox: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sosTitle: { fontSize: 14, fontWeight: '600', color: C.charcoal, marginBottom: 4 },
  sosSub: { fontSize: 11, color: C.muted },
  patternsCard: { backgroundColor: C.white, borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: C.warm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  patternsIconBox: { width: 46, height: 46, borderRadius: 15, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  patternsTitle: { fontSize: 14, fontWeight: '600', color: C.charcoal, marginBottom: 4 },
  patternsSub: { fontSize: 11, color: C.muted },
  cycleCard: { backgroundColor: C.white, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.mint, borderLeftWidth: 4, borderLeftColor: C.moss, shadowColor: C.forestDeep, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  cycleIconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cycleTitle: { fontSize: 14, fontWeight: '600', color: C.charcoal, marginBottom: 2 },
  cycleSub: { fontSize: 12, color: C.muted },
  cycleArrow: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center' },
  cycleModalLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  cycleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  cycleChipText: { fontSize: 13, fontWeight: '500' },
  painDotBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  painDotBtnText: { fontSize: 14, fontWeight: '700' },
  cycleSaveBtn: { backgroundColor: C.forest, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: C.forestDeep, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4, marginBottom: 8 },
  cycleSaveBtnText: { color: C.white, fontWeight: '600', fontSize: 15 },
  entryCard: { backgroundColor: C.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.warm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  entryDate: { fontSize: 11, color: C.muted, textTransform: 'capitalize', fontWeight: '500' },
  painBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  painDot: { width: 6, height: 6, borderRadius: 3 },
  painText: { fontSize: 11, fontWeight: '700' },
  entryBody: { fontSize: 14, color: C.charcoal, lineHeight: 22 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  sheetIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 22, fontWeight: '300', color: C.charcoal, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 12 },
  sheetBody: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  sheetBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  sheetBtnText: { color: C.white, fontWeight: '600', fontSize: 15 },
  plansSheet: { paddingTop: 24 },
  plansTitle: { fontSize: 22, fontWeight: '300', color: C.charcoal, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 6, textAlign: 'center' },
  plansBody: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20 },
  planRow: { borderWidth: 1, borderColor: C.warm, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, position: 'relative', overflow: 'hidden' },
  planYearBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: C.gold, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  planYearBadgeText: { fontSize: 10, color: C.white, fontWeight: '700' },
  planName: { fontSize: 16, fontWeight: '600', color: C.charcoal, marginBottom: 2 },
  planDesc: { fontSize: 12, color: C.muted },
  planPrice: { fontSize: 20, fontWeight: '700', color: C.forest },
  planPer: { fontSize: 11, color: C.muted },
  warningBanner: { position: 'absolute', left: 12, right: 12, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 999 },
  warningIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  warningTitle: { color: C.white, fontWeight: '600', fontSize: 13 },
  warningBody: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  warningBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  warningBtnText: { color: C.white, fontSize: 12, fontWeight: '600' },
});
