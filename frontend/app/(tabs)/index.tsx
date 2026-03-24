import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_COLORS, spacing, borderRadius, typography, shadows } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getSubscriptionStatus, getWeather } from '../../src/services/api';
import { WeeklyStatsCard } from '../../src/components/WeeklyStatsCard';
import { ResponsiveLayout } from '../../src/components/ResponsiveLayout';
import { useResponsive } from '../../src/hooks/useResponsive';
import * as Location from 'expo-location';

const screenWidth = Dimensions.get('window').width;

// Premium Action Cards
const PREMIUM_ACTIONS = [
  { id: 'talk', label: 'Hablar con Ágora', color: '#C98D5E', route: '/(tabs)/chat', emoji: '💬' },
  { id: 'write', label: 'Escribir Diario', color: '#9FA89F', route: '/diary/new', emoji: '✍️' },
  { id: 'patterns', label: 'Mis Patrones', color: '#B8956A', route: '/(tabs)/patterns', emoji: '📊' },
  { id: 'track', label: 'Registro Mensual', color: '#A07B7B', route: '/(tabs)/monthly-record', emoji: '📅' },
  { id: 'resources', label: 'Recursos', color: '#7A9B8E', route: '/resources', emoji: '📚' },
  { id: 'wellbeing', label: 'Bienestar', color: '#8FA89F', route: '/cycle', emoji: '🌿' },
];

// Wellness Tips  
const WELLNESS_TIPS = [
  { icon: 'water-outline', title: 'Hidratación', subtitle: 'Bebe agua regularmente para mantener tu cuerpo en equilibrio' },
  { icon: 'moon-outline', title: 'Descanso', subtitle: 'El sueño es fundamental para tu salud emocional y física' },
  { icon: 'flower-outline', title: 'Respira', subtitle: 'Tómate un momento para respirar profundamente' },
  { icon: 'heart-outline', title: 'Cuidados', subtitle: 'Hoy es un buen día para quererte a ti misma' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { deviceId, subscriptionStatus, setSubscriptionStatus } = useStore();
  const responsive = useResponsive();

  const [weather, setWeather] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const loadData = useCallback(async () => {
    if (!deviceId) return;
    try {
      const status = await getSubscriptionStatus(deviceId);
      setSubscriptionStatus(status);
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const w = await getWeather(loc.coords.latitude, loc.coords.longitude);
          setWeather(w);
        }
      } catch {
        // Weather optional
      }
    } catch (e) {
      console.error('[Home] loadData:', e);
    }
  }, [deviceId, setSubscriptionStatus]);

  useEffect(() => {
    loadData();
    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % WELLNESS_TIPS.length);
    }, 8000);
    return () => clearInterval(tipTimer);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Buenos días', emoji: '🌅' };
    if (hour < 18) return { text: 'Buenas tardes', emoji: '☀️' };
    return { text: 'Buenas noches', emoji: '🌙' };
  };

  const greeting = getGreeting();
  const styles = getResponsiveStyles(responsive);

  return (
    <ResponsiveLayout backgroundColor="#FDFBF9">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_COLORS.crisisBtn} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER - Welcome Section */}
        <View style={styles.headerSection}>
          <View style={styles.greetingContainer}>
            <Text style={styles.emoji}>{greeting.emoji}</Text>
            <View style={styles.greetingText}>
              <Text style={styles.greetingMain}>{greeting.text}</Text>
              <Text style={styles.greetingLabel}>Bienvenida a tu espacio</Text>
            </View>
          </View>

          {/* Status Badge */}
          {subscriptionStatus?.status === 'trial' && (
            <View style={[styles.statusBadge, styles.trialBadge]}>
              <Ionicons name="time-outline" size={14} color="#80704F" />
              <Text style={styles.badgeText}>
                {formatTrialTime(subscriptionStatus.trial_remaining_seconds || 0)}
              </Text>
            </View>
          )}
          {subscriptionStatus?.status === 'expired' && (
            <View style={[styles.statusBadge, styles.expiredBadge]}>
              <Ionicons name="alert-circle-outline" size={14} color="#A07B7B" />
              <Text style={styles.expiredBadgeText}>Prueba finalizada</Text>
            </View>
          )}
          {subscriptionStatus?.status === 'active' && (
            <View style={[styles.statusBadge, styles.activeBadge]}>
              <Ionicons name="checkmark-circle" size={14} color="#7A9B8E" />
              <Text style={styles.activeBadgeText}>Activo</Text>
            </View>
          )}
        </View>

        {/* CRISIS BUTTON */}
        <TouchableOpacity
          style={[styles.crisisButton, shadows.lg]}
          onPress={() => router.push('/crisis')}
          activeOpacity={0.85}
        >
          <View style={styles.crisisGradient}>
            <View style={styles.crisisLeft}>
              <Text style={styles.crisisEmoji}>🆘</Text>
              <View style={styles.crisisTextBlock}>
                <Text style={styles.crisisTitle}>Necesito ayuda</Text>
                <Text style={styles.crisisSubtitle}>Crisis 24/7</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* WELLNESS TIP */}
        <View style={[styles.wellnessTipCard, shadows.md]}>
          <View style={styles.tipIconWrapper}>
            <Ionicons name={WELLNESS_TIPS[tipIndex].icon as any} size={20} color="#80704F" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{WELLNESS_TIPS[tipIndex].title}</Text>
            <Text style={styles.tipSubtitle}>{WELLNESS_TIPS[tipIndex].subtitle}</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Qué necesitas hoy</Text>
          <View style={styles.actionsGrid}>
            {PREMIUM_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, shadows.md]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.actionColorBg, { backgroundColor: action.color }]}>
                  <Text style={styles.actionEmojiLarge}>{action.emoji}</Text>
                </View>
                <Text style={styles.actionCardLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* WEATHER */}
        {weather && (
          <View style={[styles.weatherCard, shadows.sm]}>
            <Ionicons name="partly-sunny-outline" size={20} color="#80704F" />
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherTemp}>{Math.round(weather.temperature)}°C</Text>
              <Text style={styles.weatherHumidity}>{weather.humidity}% humedad</Text>
            </View>
          </View>
        )}

        {/* WEEKLY STATS */}
        {deviceId && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Tu semana</Text>
            <WeeklyStatsCard deviceId={deviceId} />
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </ResponsiveLayout>
  );
}

function formatTrialTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getResponsiveStyles(responsive: ReturnType<typeof useResponsive>) {
  const { isDesktop, isTablet } = responsive;
  const paddingX = isDesktop ? 60 : isTablet ? 40 : 20;

  return StyleSheet.create({
    scroll: { flex: 1 },
    contentContainer: { paddingHorizontal: paddingX, paddingTop: spacing.lg, paddingBottom: 40 },
    
    // HEADER
    headerSection: { marginBottom: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    greetingContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    emoji: { fontSize: isDesktop ? 48 : isTablet ? 40 : 36 },
    greetingText: { flex: 1 },
    greetingMain: { fontSize: isDesktop ? 28 : isTablet ? 24 : 22, fontWeight: '700', fontFamily: 'Cormorant_700Bold', color: '#3D2B1A', marginBottom: 2 },
    greetingLabel: { fontSize: isDesktop ? 13 : 12, color: '#B5A997', fontFamily: 'Nunito_400Regular' },

    // Status Badge
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
    trialBadge: { backgroundColor: '#F5EFE5' },
    badgeText: { fontSize: 12, fontWeight: '600', color: '#80704F', fontFamily: 'Nunito_600SemiBold' },
    expiredBadge: { backgroundColor: 'rgba(160,123,123,0.1)' },
    expiredBadgeText: { fontSize: 12, fontWeight: '600', color: '#A07B7B', fontFamily: 'Nunito_600SemiBold' },
    activeBadge: { backgroundColor: 'rgba(122,155,142,0.1)' },
    activeBadgeText: { fontSize: 12, fontWeight: '600', color: '#7A9B8E', fontFamily: 'Nunito_600SemiBold' },

    // CRISIS BUTTON
    crisisButton: { backgroundColor: '#7A3D36', borderRadius: borderRadius.lg, marginBottom: spacing.xl, overflow: 'hidden' },
    crisisGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
    crisisLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    crisisEmoji: { fontSize: 32 },
    crisisTextBlock: { flex: 1 },
    crisisTitle: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold', marginBottom: 2 },
    crisisSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: 'Nunito_400Regular' },

    // WELLNESS TIP
    wellnessTipCard: { backgroundColor: '#fff', borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, marginBottom: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    tipIconWrapper: { width: 48, height: 48, backgroundColor: 'rgba(128,112,79,0.1)', borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
    tipContent: { flex: 1 },
    tipTitle: { fontSize: 14, fontWeight: '700', color: '#3D2B1A', fontFamily: 'Nunito_700Bold', marginBottom: 2 },
    tipSubtitle: { fontSize: 12, color: '#8FA89F', fontFamily: 'Nunito_400Regular', lineHeight: 16 },

    // ACTIONS
    actionsContainer: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: isDesktop ? 18 : 16, fontWeight: '700', color: '#3D2B1A', fontFamily: 'Cormorant_700Bold', marginBottom: spacing.lg },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
    actionCard: { width: isDesktop ? '31%' : '48%', backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', gap: spacing.sm },
    actionColorBg: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
    actionEmojiLarge: { fontSize: 36 },
    actionCardLabel: { fontSize: 12, fontWeight: '600', color: '#3D2B1A', fontFamily: 'Nunito_600SemiBold', textAlign: 'center', lineHeight: 16 },

    // WEATHER
    weatherCard: { backgroundColor: '#fff', borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    weatherInfo: { flex: 1 },
    weatherTemp: { fontSize: 16, fontWeight: '700', color: '#3D2B1A', fontFamily: 'Nunito_700Bold' },
    weatherHumidity: { fontSize: 12, color: '#B5A997', fontFamily: 'Nunito_400Regular' },

    // STATS
    statsSection: { marginTop: spacing.lg },
  });
}
