import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, StyleSheet, Text, View, TouchableOpacity, Dimensions, ScrollView, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { getCommunityCount, obtenerSintomasCronico } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import api from '../../services/api';
const { width, height } = Dimensions.get('window');
const colorText = '#8B5A2B';
const colorAccent = '#C5A059';

const TIMER_DURATION = 5400;
const TIMER_KEY      = 'agora_timer_start';
const TIMER_DATE_KEY = 'agora_timer_date';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function calcRemaining(startTs: number): number {
  const elapsed = Math.floor((Date.now() - startTs) / 1000);
  return Math.max(0, TIMER_DURATION - elapsed);
}

export default function HomeSantuario() {
  const router = useRouter();
  const devMode = useUserStore((state) => state.devMode);
  const user = useUserStore((state) => state.user);
  const lastGlucosa = useUserStore((state) => state.lastGlucosa);
  const lastCiclo = useUserStore((state) => state.lastCiclo);

  const [communityCount, setCommunityCount] = useState<number | null>(null);
  const [communityMsg, setCommunityMsg]     = useState('');
  const [sintomasHoy, setSintomasHoy]       = useState<any[]>([]);
  const [loadingSintomas, setLoadingSintomas] = useState(false);
  const [secondsLeft, setSecondsLeft]       = useState(TIMER_DURATION);
  const [isBlocked, setIsBlocked]           = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    getCommunityCount().then((data) => {
      if (data && typeof data.community_size === 'number') {
        setCommunityCount(data.community_size);
        setCommunityMsg(data.message_es || '');
      }
    });
    const token = useUserStore.getState().token;
    if (token) {
      setLoadingSintomas(true);
      try {
        const response = await api.get('/api/user/stats');
        const data = response.data;

        // Actualizamos el Store con lo que viene de la base de datos
      useUserStore.getState().setLastGlucosa(data.glucosa);
      useUserStore.getState().setLastCiclo(data.ciclo);
      
    } catch (e) {
      console.log("Error cargando stats:", e);
    } finally {
      setLoadingSintomas(false);
    }
  }
};

  const syncTimer = async () => {
    if (devMode) return;
    try {
      const savedDate = await AsyncStorage.getItem(TIMER_DATE_KEY);
      const today = todayString();
      if (savedDate !== today) {
        const now = Date.now();
        await AsyncStorage.setItem(TIMER_KEY, now.toString());
        await AsyncStorage.setItem(TIMER_DATE_KEY, today);
        setSecondsLeft(TIMER_DURATION);
        setIsBlocked(false);
        return;
      }
      const stored = await AsyncStorage.getItem(TIMER_KEY);
      if (stored) {
        const remaining = calcRemaining(parseInt(stored, 10));
        setSecondsLeft(remaining);
        if (remaining <= 0) setIsBlocked(true);
      }
    } catch (e) { console.log(e); }
  };

  useEffect(() => { syncTimer(); }, [devMode]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => { if (next === 'active') syncTimer(); });
    return () => sub.remove();
  }, [devMode]);

  useEffect(() => {
    if (isBlocked || devMode) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsBlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isBlocked, devMode]);

  const displayMinutes = Math.floor(secondsLeft / 60);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 3000 }), withTiming(1, { duration: 3000 })),
      -1, true
    );
  }, []);
  const animatedOrb = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (isBlocked && !devMode) {
    return (
      <View style={styles.blockedContainer}>
        <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
        <Ionicons name="lock-closed-outline" size={80} color={colorText} style={{ opacity: 0.2, marginBottom: 20 }} />
        <Text style={styles.timeBig}>0</Text>
        <Text style={styles.blockedTitle}>TIEMPO AGOTADO</Text>
        <Text style={styles.blockedDesc}>Sesión diaria completada. Suscríbete para acceso ilimitado.</Text>
        <TouchableOpacity style={styles.premiumBtn} onPress={() => router.push('/plan')}>
          <LinearGradient colors={['#C5A059', '#8B5A2B']} style={styles.premiumBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.premiumBtnText}>VER PLANES PREMIUM</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <Image source={require('../../assets/images/logo2.png')} style={styles.bgLogo} resizeMode="contain" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {communityCount !== null && (
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ color: colorAccent, fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>{communityMsg}</Text>
          </View>
        )}

        <View style={styles.header}>
          <View>
            <Text style={styles.brandSubtitle}>MI BITÁCORA</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeBig}>{devMode ? '∞' : displayMinutes}</Text>
              <View style={styles.timeLabelContainer}>
                <Text style={styles.timeLabel}>{devMode ? 'acceso' : 'minutos'}</Text>
                <Text style={styles.timeSubLabel}>{devMode ? 'ilimitado' : 'de paz'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.pdfBtn}>
            <Ionicons name="document-text-outline" size={16} color={colorText} />
            <Text style={styles.pdfText}>INFORME MÉDICO</Text>
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.quoteCard}>
          <Text style={styles.quoteText}>"Escucha tu cuerpo; cada registro es un paso hacia tu bienestar."</Text>
        </Animated.View>

        <View style={styles.actionSection}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/chat')} style={styles.orbShadow}>
            <Animated.View style={[styles.mainOrb, animatedOrb]}>
              <LinearGradient colors={[colorText, colorAccent]} style={StyleSheet.absoluteFill} />
              <Ionicons name="mic-outline" size={35} color="white" />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.orbLabel}>HABLAR CON ÁGORA</Text>
        </View>

        <View style={styles.grid}>
          {/* TARJETA DE GLUCOSA */}
          <TouchableOpacity style={styles.healthCard} onPress={() => router.push('/glucosa')}>
            <MaterialCommunityIcons name="water-percent" size={22} color={colorAccent} />
            <Text style={styles.cardValue}>
              {lastGlucosa ? lastGlucosa.valor : '0'}
            </Text>
            <Text style={styles.cardTitle}>GLUCOSA {lastGlucosa ? '(mg/dL)' : ''}</Text>
          </TouchableOpacity>

          {/* TARJETA DE CICLO */}
          <TouchableOpacity style={styles.healthCard} onPress={() => router.push('/ciclo')}>
            <MaterialCommunityIcons name="flower-outline" size={22} color={colorText} />
            <Text style={styles.cardValue}>
              {lastCiclo ? lastCiclo.duracion : '0'}
            </Text>
            <Text style={styles.cardTitle}>DURACIÓN CICLO</Text>
          </TouchableOpacity>
        </View>

        {/* --- SECCIÓN SÍNTOMAS PRO --- */}
        <View style={styles.proSymptomsCard}>
          <View style={styles.proHeader}>
            <View style={styles.proTitleWrapper}>
              <MaterialCommunityIcons name="leaf" size={16} color={colorAccent} />
              <Text style={styles.proTitle}>SÍNTOMAS RECIENTES</Text>
            </View>
            <TouchableOpacity style={styles.proAddButton} onPress={() => router.push('/(tabs)/sintomas-cronico')}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.proContent}>
            {loadingSintomas ? (
              <ActivityIndicator size="small" color={colorAccent} />
            ) : sintomasHoy.length === 0 ? (
              <Text style={styles.proEmptyText}>Bitácora limpia. ¿Deseas registrar algo?</Text>
            ) : (
              <View style={styles.proChipsContainer}>
                {sintomasHoy.map((reg, idx) => (
                  <View key={idx} style={styles.proChip}>
                    <Text style={styles.proChipText}>{reg.zona || 'General'}</Text>
                    <View style={styles.proChipDot} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.diaryBtn} onPress={() => router.push('/diario')}>
          <LinearGradient colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']} style={[StyleSheet.absoluteFill, { borderRadius: 30 }]} />
          <View style={styles.diaryContent}>
            <Ionicons name="book-outline" size={20} color={colorText} />
            <Text style={styles.diaryBtnText}>ESCRIBIR EN MI DIARIO PERSONAL</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLogo: { position: 'absolute', width: width * 1.5, height: width * 1.5, alignSelf: 'center', top: height * 0.1, opacity: 0.03 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  brandSubtitle: { fontSize: 10, letterSpacing: 2, color: colorText, opacity: 0.6, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: -5 },
  timeBig: { fontSize: 110, fontWeight: '100', color: colorText, letterSpacing: -5 },
  timeLabelContainer: { marginTop: -15 },
  timeLabel: { fontSize: 16, color: colorText, fontStyle: 'italic', opacity: 0.8 },
  timeSubLabel: { fontSize: 10, color: colorText, opacity: 0.5, letterSpacing: 1 },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(139,90,43,0.1)' },
  pdfText: { fontSize: 9, fontWeight: 'bold', color: colorText, letterSpacing: 1 },
  quoteCard: { backgroundColor: 'rgba(255,255,255,0.3)', padding: 22, borderRadius: 30, marginBottom: 40, borderLeftWidth: 3, borderLeftColor: colorAccent },
  quoteText: { fontSize: 14, color: colorText, fontStyle: 'italic', lineHeight: 22, fontWeight: '300' },
  actionSection: { alignItems: 'center', marginBottom: 50 },
  orbShadow: { shadowColor: colorAccent, shadowOpacity: 0.25, shadowRadius: 25, elevation: 15, borderRadius: 60 },
  mainOrb: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  orbLabel: { marginTop: 18, fontSize: 10, letterSpacing: 4, color: colorText, fontWeight: 'bold', opacity: 0.7 },
  grid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  healthCard: { flex: 1, padding: 22, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 35, borderWidth: 1, borderColor: 'white', alignItems: 'center' },
  cardValue: { fontSize: 28, color: colorText, fontWeight: '300', marginVertical: 5 },
  cardTitle: { fontSize: 9, fontWeight: 'bold', color: colorAccent, letterSpacing: 1 },
  proSymptomsCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 24, marginBottom: 20, elevation: 4, borderWidth: 1, borderColor: 'rgba(234, 219, 200, 0.5)' },
  proHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  proTitleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proTitle: { fontSize: 11, fontWeight: 'bold', color: colorText, letterSpacing: 1.5 },
  proAddButton: { backgroundColor: colorText, width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  proContent: { minHeight: 40, justifyContent: 'center' },
  proEmptyText: { fontSize: 13, color: colorText, opacity: 0.5, fontStyle: 'italic' },
  proChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  proChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDFCFB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: '#F5F0E8', gap: 6 },
  proChipText: { fontSize: 12, fontWeight: '600', color: colorText },
  proChipDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colorAccent },
  diaryBtn: { marginTop: 10, borderRadius: 30, borderWidth: 1, borderColor: 'white', overflow: 'hidden' },
  diaryContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22 },
  diaryBtnText: { fontSize: 11, fontWeight: 'bold', color: colorText, letterSpacing: 1 },
  blockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  blockedTitle: { fontSize: 22, fontWeight: 'bold', color: colorText, letterSpacing: 2 },
  blockedDesc: { textAlign: 'center', color: colorText, opacity: 0.6, marginBottom: 30 },
  premiumBtn: { borderRadius: 20, overflow: 'hidden' },
  premiumBtnGradient: { paddingVertical: 18, paddingHorizontal: 30 },
  premiumBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
});