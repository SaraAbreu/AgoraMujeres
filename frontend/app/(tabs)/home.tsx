/**
 * home.tsx — Pantalla de inicio de Ágora Mujeres
 * Flujo de suscripción:
 *  trial   → 1h 30min gratis (5400s). Indicador muy suave.
 *  trial expirado → modal cálido con opción 5,90€/24h
 *  active  → contador íntimo de las 24h
 *  expired → modal de planes (5,90€/mes · 59€/año)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Platform, Modal,
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
  forest:'#4A664D', forestDim:'#3A5140', moss:'#6B8F6E', sage:'#A8C5A0',
  mint:'#D4E8D0', mintSoft:'#EAF4E8', cream:'#F8F7F2', parchment:'#F0EDE4',
  muted:'#9A958E', charcoal:'#3D3A35', white:'#FFFFFF', gold:'#C9A84C',
};

const QUOTES = [
  'Hoy no tienes que poder con todo. Solo con este momento.',
  'Tu cuerpo hace lo mejor que puede. Merece tu ternura.',
  'Pequeños pasos siguen siendo movimiento hacia adelante.',
  'Escucharte es un acto de amor hacia ti misma.',
  'La calma también es una forma de fortaleza.',
  'No estás sola en esto. Ágora siempre está aquí.',
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

function FadeIn({ delay = 0, children }: any) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue:1, duration:480, delay, useNativeDriver:true }),
      Animated.timing(y, { toValue:0, duration:480, delay, useNativeDriver:true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity:a, transform:[{translateY:y}] }}>{children}</Animated.View>;
}

function Pulse({ color }: { color: string }) {
  const s = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(s, { toValue:1.7, duration:1800, useNativeDriver:true }),
      Animated.timing(s, { toValue:1,   duration:1800, useNativeDriver:true }),
    ])).start();
  }, []);
  return <Animated.View style={{ width:7, height:7, borderRadius:4, backgroundColor:color, transform:[{scale:s}] }} />;
}

function Press({ onPress, style, children }: any) {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[style, { transform:[{scale:sc}] }]}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(sc,{toValue:0.97,useNativeDriver:true}).start()}
        onPressOut={() => Animated.spring(sc,{toValue:1,friction:4,useNativeDriver:true}).start()}
        onPress={onPress} activeOpacity={1}
      >{children}</TouchableOpacity>
    </Animated.View>
  );
}

// ── Modal: trial expirado → 5,90€/24h ─────────────────────────
function TrialModal({ visible, onBuy, onPlans, loading }: any) {
  const sl = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    if (visible) Animated.spring(sl,{toValue:0,tension:60,friction:12,useNativeDriver:true}).start();
    else sl.setValue(300);
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, { transform:[{translateY:sl}] }]}>
          <Text style={s.sheetLeaf}>🌿</Text>
          <Text style={s.sheetTitle}>Tu tiempo de prueba{'\n'}ha terminado</Text>
          <Text style={s.sheetBody}>
            Si Ágora te ha acompañado, puedes continuar tu día de calma
            por solo <Text style={{fontWeight:'700',color:C.forest}}>5,90 €</Text>.
          </Text>
          <Press onPress={onBuy} style={{width:'100%'}}>
            <LinearGradient colors={[C.forest,C.moss]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.sheetBtn}>
              <Text style={s.sheetBtnText}>{loading ? 'Un momento…' : 'Continuar · 5,90 € / 24 h'}</Text>
            </LinearGradient>
          </Press>
          <TouchableOpacity onPress={onPlans} style={{paddingVertical:10}}>
            <Text style={{fontSize:13,color:C.muted}}>Ver planes de acompañamiento</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Modal: planes ─────────────────────────────────────────────
function PlansModal({ visible, onSubscribe, onClose, loading }: any) {
  const sl = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    if (visible) Animated.spring(sl,{toValue:0,tension:55,friction:11,useNativeDriver:true}).start();
    else sl.setValue(400);
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, s.plansSheet, { transform:[{translateY:sl}] }]}>
          <Text style={s.plansTitle}>Quedarte con Ágora</Text>
          <Text style={s.plansBody}>Sin urgencia, sin presión. Aquí cuando la necesites.</Text>

          {/* Monthly */}
          <Press onPress={() => onSubscribe('monthly')} style={{width:'100%'}}>
            <View style={s.planRow}>
              <View style={{flex:1}}>
                <Text style={s.planName}>Mensual</Text>
                <Text style={s.planDesc}>Acceso completo · cancela cuando quieras</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={s.planPrice}>5,90 €</Text>
                <Text style={s.planPer}>/mes</Text>
              </View>
            </View>
          </Press>

          {/* Yearly */}
          <Press onPress={() => onSubscribe('yearly')} style={{width:'100%'}}>
            <LinearGradient colors={[C.forestDim,C.forest]} start={{x:0,y:0}} end={{x:1,y:0}} style={[s.planRow,{borderColor:'transparent'}]}>
              <View style={s.planYearBadge}><Text style={s.planYearBadgeText}>2 meses gratis</Text></View>
              <View style={{flex:1}}>
                <Text style={[s.planName,{color:C.white}]}>Anual</Text>
                <Text style={[s.planDesc,{color:C.sage}]}>Todo incluido · acceso prioritario</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={[s.planPrice,{color:C.white}]}>59 €</Text>
                <Text style={[s.planPer,{color:C.sage}]}>/año</Text>
              </View>
            </LinearGradient>
          </Press>

          <View style={{flexDirection:'row',alignItems:'center',gap:5,marginTop:4}}>
            <Ionicons name="lock-closed-outline" size={12} color={C.muted} />
            <Text style={{fontSize:11,color:C.muted,fontStyle:'italic'}}>Pago seguro · Sin compromisos</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{paddingVertical:8}}>
            <Text style={{fontSize:13,color:C.muted}}>Ahora no</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData, deviceId, contador } = useUserStore();

  const [sub, setSub]         = useState<SubscriptionStatus | null>(null);
  const [secs, setSecs]       = useState(0);
  const [lastEntry, setLast]  = useState<any>(null);
  const [showTrial, setTrial] = useState(false);
  const [showPlans, setPlans] = useState(false);
  const [buying, setBuying]   = useState<string|null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const name  = userData?.name?.split(' ')[0] || 'tú';
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  const loadSub = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await getSubscriptionStatus(deviceId);
      setSub(data);
      const rem = data.trial_remaining_seconds ?? 0;
      setSecs(rem);
      if (data.status === 'expired') { setPlans(true); return; }
      if (data.status === 'trial' && rem <= 0) { setTrial(true); }
    } catch {}
  }, [deviceId]);

  useEffect(() => {
    loadSub();
    if (deviceId) getDiaryEntries(deviceId, 1).then(e => e.length && setLast(e[0])).catch(()=>{});
  }, [deviceId]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!sub || secs <= 0) return;
    tickRef.current = setInterval(() => {
      setSecs(prev => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          clearInterval(tickRef.current!);
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
      if (userData?.email) await createCustomer(deviceId, userData.email, userData.name).catch(()=>{});
      const intent = await createPaymentIntent(deviceId);
      await activateSubscription(deviceId, intent.payment_intent_id || intent.id);
      setTrial(false); setPlans(false);
      await loadSub();
    } catch {} finally { setBuying(null); }
  };

  const trialLabel =
    sub?.status === 'active' && secs > 0 ? `Quedan ${fmt(secs)} de tu día de calma` :
    sub?.status === 'trial' && secs > 0   ? `Acceso libre · ${fmt(secs)}` : null;

  return (
    <View style={{flex:1, backgroundColor:C.cream}}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[C.forestDim,C.forest]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={[s.header, {paddingTop: insets.top + 16}]}>
        <View style={s.headerRow}>
          <View style={{flex:1}}>
            <Text style={s.greeting}>{getGreeting()},</Text>
            <Text style={s.name}>{name}.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={s.avatarBtn}>
            <Ionicons name="person-circle-outline" size={34} color={C.sage} />
          </TouchableOpacity>
        </View>
        {trialLabel && (
          <View style={s.trialPill}>
            <Pulse color={sub?.status === 'active' ? C.gold : C.sage} />
            <Text style={s.trialText}>{trialLabel}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scroll, {paddingBottom: insets.bottom + 96}]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quote */}
        <FadeIn delay={60}>
          <View style={s.quoteCard}>
            <Text style={s.qMark}>"</Text>
            <Text style={s.qText}>{quote}</Text>
            <View style={s.qLine} />
            <Text style={s.qLabel}>Reflexión del día</Text>
          </View>
        </FadeIn>

        {/* Primary CTA */}
        <FadeIn delay={130}>
          <Press onPress={() => router.push('/diary/new')}>
            <LinearGradient colors={[C.forest,C.moss]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primary}>
              <View style={s.primaryIconBox}>
                <Text style={{fontSize:24}}>📓</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={s.primaryTitle}>¿Cómo te sientes hoy?</Text>
                <Text style={s.primarySub}>
                  {lastEntry
                    ? `Última vez: ${new Date(lastEntry.created_at).toLocaleDateString('es-ES',{weekday:'long'})}`
                    : 'Cuéntamelo con calma'}
                </Text>
              </View>
              <Ionicons name="add-circle" size={28} color={C.mint} />
            </LinearGradient>
          </Press>
        </FadeIn>

        {/* Quick actions */}
        <FadeIn delay={200}>
          <View style={s.row}>
            <Press onPress={() => router.push('/crisis')} style={{flex:1}}>
              <View style={s.actionCard}>
                <View style={[s.actionIcon, {backgroundColor:'#FDE8E8'}]}>
                  <Ionicons name="heart" size={20} color="#C0614A" />
                </View>
                <Text style={s.actionTitle}>S.O.S Calma</Text>
                <Text style={s.actionSub}>Te sostengo ahora</Text>
              </View>
            </Press>
            <Press onPress={() => router.push('/(tabs)/patterns')} style={{flex:1}}>
              <View style={s.actionCard}>
                <View style={[s.actionIcon, {backgroundColor:C.mintSoft}]}>
                  <Ionicons name="analytics-outline" size={20} color={C.moss} />
                </View>
                <Text style={s.actionTitle}>Mis Patrones</Text>
                <Text style={s.actionSub}>Entenderme mejor</Text>
              </View>
            </Press>
          </View>
        </FadeIn>

        {/* Last entry */}
        {lastEntry && (
          <FadeIn delay={270}>
            <Text style={s.sectionLabel}>Última entrada</Text>
            <Press onPress={() => router.push('/(tabs)/diary')}>
              <View style={s.entryCard}>
                <View style={s.entryTop}>
                  <Text style={s.entryDate}>
                    {new Date(lastEntry.created_at).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
                  </Text>
                  {(lastEntry.dolor ?? 0) > 0 && (
                    <View style={[s.painBadge,{backgroundColor:painColor(lastEntry.dolor)+'22'}]}>
                      <View style={[s.painDot,{backgroundColor:painColor(lastEntry.dolor)}]} />
                      <Text style={[s.painText,{color:painColor(lastEntry.dolor)}]}>{lastEntry.dolor}/10</Text>
                    </View>
                  )}
                </View>
                <Text style={s.entryBody} numberOfLines={3}>
                  {lastEntry.texto
                    ? lastEntry.texto
                    : [...(lastEntry.cuerpo||[]),...(lastEntry.mente||[]),...(lastEntry.alma||[])].slice(0,4).join(' · ')}
                </Text>
              </View>
            </Press>
          </FadeIn>
        )}

        {/* Streak */}
        <FadeIn delay={340}>
          <View style={s.streakCard}>
            <View style={s.streakLeft}>
              <Text style={s.streakNum}>{contador}</Text>
              <Text style={s.streakUnit}>días{'\n'}de cuidado</Text>
            </View>
            <Text style={s.streakMsg}>
              {contador > 0
                ? `Llevas ${contador} ${contador===1?'día':'días'} escuchándote.\nEso importa.`
                : 'Hoy es un buen día para\nempezar a escucharte.'}
            </Text>
          </View>
        </FadeIn>
      </ScrollView>

      <TrialModal
        visible={showTrial}
        onBuy={() => doPurchase('24h')}
        onPlans={() => { setTrial(false); setPlans(true); }}
        loading={buying === '24h'}
      />
      <PlansModal
        visible={showPlans}
        onClose={() => setPlans(false)}
        onSubscribe={doPurchase}
        loading={buying}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { paddingHorizontal:22, paddingBottom:22, borderBottomLeftRadius:28, borderBottomRightRadius:28 },
  headerRow: { flexDirection:'row', alignItems:'flex-start', marginBottom:14 },
  greeting: { color:C.sage, fontSize:13 },
  name: { color:C.white, fontSize:30, fontWeight:'800', letterSpacing:-0.5, marginTop:2 },
  avatarBtn: { padding:2, marginTop:4 },
  trialPill: {
    flexDirection:'row', alignItems:'center', gap:8,
    backgroundColor:'rgba(255,255,255,0.13)', borderRadius:100,
    paddingVertical:7, paddingHorizontal:13, alignSelf:'flex-start',
  },
  trialText: { color:C.white, fontSize:12, fontWeight:'500', opacity:0.9 },

  scroll: { paddingHorizontal:16, paddingTop:18, gap:12 },
  sectionLabel: { fontSize:10, fontWeight:'700', color:C.muted, textTransform:'uppercase', letterSpacing:2.5, marginTop:4, marginBottom:2 },

  quoteCard: {
    backgroundColor:C.white, borderRadius:20, padding:22, borderLeftWidth:3, borderLeftColor:C.sage,
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2,
  },
  qMark: { fontSize:40, color:C.mint, lineHeight:36, fontFamily: Platform.OS==='ios'?'Georgia':'serif' },
  qText: { fontSize:15, color:C.charcoal, lineHeight:24, fontStyle:'italic', fontFamily: Platform.OS==='ios'?'Georgia':'serif', marginBottom:14 },
  qLine: { width:28, height:1.5, backgroundColor:C.mint, marginBottom:10 },
  qLabel: { fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:2 },

  primary: {
    borderRadius:20, padding:18, flexDirection:'row', alignItems:'center', gap:14,
    shadowColor:C.forest, shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:6,
  },
  primaryIconBox: { width:46, height:46, borderRadius:14, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  primaryTitle: { color:C.white, fontSize:16, fontWeight:'700', marginBottom:3 },
  primarySub: { color:C.mint, fontSize:12, opacity:0.9 },

  row: { flexDirection:'row', gap:12 },
  actionCard: {
    backgroundColor:C.white, borderRadius:18, padding:18,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:1,
    gap:8, minHeight:110,
  },
  actionIcon: { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
  actionTitle: { fontSize:14, fontWeight:'700', color:C.charcoal },
  actionSub: { fontSize:11, color:C.muted },

  entryCard: {
    backgroundColor:C.white, borderRadius:18, padding:18,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:5, elevation:1,
  },
  entryTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  entryDate: { fontSize:12, color:C.moss, fontWeight:'600', textTransform:'capitalize', flex:1 },
  entryBody: { fontSize:14, color:C.charcoal, lineHeight:22, fontStyle:'italic' },
  painBadge: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  painDot: { width:6, height:6, borderRadius:3 },
  painText: { fontSize:10, fontWeight:'700' },

  streakCard: {
    backgroundColor:C.white, borderRadius:18, padding:18,
    flexDirection:'row', alignItems:'center', gap:16,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:5, elevation:1,
  },
  streakLeft: { alignItems:'center', minWidth:54 },
  streakNum: { fontSize:36, fontWeight:'800', color:C.forest, lineHeight:38 },
  streakUnit: { fontSize:10, color:C.muted, textAlign:'center', lineHeight:14, marginTop:2 },
  streakMsg: { flex:1, fontSize:13, color:C.charcoal, lineHeight:21, fontStyle:'italic' },

  // Modals
  overlay: { flex:1, backgroundColor:'rgba(25,20,15,0.55)', justifyContent:'flex-end' },
  sheet: {
    backgroundColor:C.cream, borderTopLeftRadius:28, borderTopRightRadius:28,
    padding:28, paddingBottom:44, alignItems:'center', gap:14,
  },
  plansSheet: { gap:12 },
  sheetLeaf: { fontSize:48 },
  sheetTitle: { fontSize:22, fontWeight:'700', color:C.charcoal, textAlign:'center', lineHeight:30 },
  sheetBody: { fontSize:14, color:C.muted, textAlign:'center', lineHeight:22, fontStyle:'italic' },
  sheetBtn: {
    borderRadius:16, paddingVertical:16, alignItems:'center', width:'100%',
    shadowColor:C.forest, shadowOffset:{width:0,height:4}, shadowOpacity:0.22, shadowRadius:10, elevation:4,
  },
  sheetBtnText: { color:C.white, fontSize:15, fontWeight:'700' },

  plansTitle: { fontSize:22, fontWeight:'700', color:C.charcoal, textAlign:'center' },
  plansBody: { fontSize:13, color:C.muted, textAlign:'center', fontStyle:'italic', lineHeight:20 },
  planRow: {
    backgroundColor:C.white, borderRadius:16, padding:16,
    flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#EDEAE4',
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:5, elevation:1,
  },
  planYearBadge: {
    position:'absolute', top:-10, left:16,
    backgroundColor:C.mint, borderRadius:100, paddingVertical:3, paddingHorizontal:10,
  },
  planYearBadgeText: { fontSize:10, fontWeight:'700', color:C.forest, textTransform:'uppercase' },
  planName: { fontSize:16, fontWeight:'700', color:C.charcoal, marginBottom:3 },
  planDesc: { fontSize:12, color:C.muted },
  planPrice: { fontSize:26, fontWeight:'800', color:C.charcoal },
  planPer: { fontSize:11, color:C.muted },
});