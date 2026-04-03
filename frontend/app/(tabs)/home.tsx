import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
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
  mintLight: '#EAF4E8',
  cream:     '#F8F7F2',
  parchment: '#F0EDE4',
  warmGray:  '#C8C3B8',
  muted:     '#9A958E',
  charcoal:  '#3D3A35',
  text:      '#2E2B26',
  textMuted: '#7A7570',
  lavender:  '#C8BFCC',
  sand:      '#DDD5C4',
  white:     '#FFFFFF',
};

// ─── Data ─────────────────────────────────────────────────
const QUOTES = [
  'A veces un día de calma es el comienzo de una nueva etapa.',
  'No tienes que poder con todo hoy. Solo con este momento.',
  'Tu cuerpo te habla. Escucharte es un acto de amor.',
  'El dolor no define lo que eres. Solo es parte de lo que sientes.',
  'Pequeños pasos siguen siendo pasos hacia adelante.',
];

// Mock weekly pain data (replace with real API data)
const WEEKLY_PAIN = [
  { day: 'L',  value: 7 },
  { day: 'M',  value: 5 },
  { day: 'X',  value: 8 },
  { day: 'J',  value: 6 },
  { day: 'V',  value: 4 },
  { day: 'S',  value: 3 },
  { day: 'D',  value: 5 },
];

const MAX_BAR_HEIGHT = 64;

// ─── Helpers ──────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Buenas noches';
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getPainColor(v: number) {
  if (v <= 2) return '#7BAF7E';
  if (v <= 4) return '#A8C07A';
  if (v <= 6) return '#D4A96A';
  if (v <= 8) return '#C07A5A';
  return '#A85050';
}

function getPainLabel(v: number) {
  if (v <= 2) return 'Muy suave';
  if (v <= 4) return 'Leve';
  if (v <= 6) return 'Moderado';
  if (v <= 8) return 'Intenso';
  return 'Muy intenso';
}

// ─── Animated Card ────────────────────────────────────────
function FadeInView({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: slideY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Quick Action Card ────────────────────────────────────
function ActionCard({
  emoji, title, subtitle, colors, onPress, wide = false,
}: {
  emoji: string; title: string; subtitle: string;
  colors: [string, string]; onPress: () => void; wide?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, wide ? { width: '100%' } : { flex: 1 }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.actionCard, wide && styles.actionCardWide]}
        >
          <Text style={styles.actionEmoji}>{emoji}</Text>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSub}>{subtitle}</Text>
          <View style={styles.actionArrow}>
            <Text style={styles.actionArrowText}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Mini Pain Chart ──────────────────────────────────────
function PainChart({ data }: { data: typeof WEEKLY_PAIN }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const today = new Date().getDay(); // 0=Sun
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((d, i) => {
          const barH = (d.value / max) * MAX_BAR_HEIGHT;
          const isToday = i === todayIdx;
          return (
            <View key={d.day} style={styles.chartCol}>
              <Text style={styles.chartVal}>{d.value}</Text>
              <View style={[styles.chartBarTrack]}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: barH,
                      backgroundColor: getPainColor(d.value),
                      opacity: isToday ? 1 : 0.65,
                    },
                    isToday && styles.chartBarToday,
                  ]}
                />
              </View>
              <Text style={[styles.chartDay, isToday && { color: C.forest, fontWeight: '700' }]}>
                {d.day}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chartLegend}>
        {[
          { label: '0–2 Suave', color: '#7BAF7E' },
          { label: '3–6 Moderado', color: '#D4A96A' },
          { label: '7–10 Intenso', color: '#A85050' },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function HomeScreen() {
  const userName  = 'Sara'; // Replace with actual user from context/store
  const lastPain  = WEEKLY_PAIN[WEEKLY_PAIN.length - 1].value;
  const avgPain   = Math.round(WEEKLY_PAIN.reduce((s, d) => s + d.value, 0) / WEEKLY_PAIN.length);
  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length];

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[C.forestDim, C.forest, C.moss]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}>{userName}.</Text>
        <Text style={styles.headerQuestion}>¿Cómo te sientes en este momento?</Text>

        {/* Last pain pill */}
        <Animated.View style={[styles.painPill, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.painDot, { backgroundColor: getPainColor(lastPain) }]} />
          <Text style={styles.painPillText}>
            Último registro: <Text style={{ fontWeight: '700' }}>{lastPain}/10</Text>{' '}
            · {getPainLabel(lastPain)}
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Quick Actions ── */}
        <FadeInView delay={100}>
          <Text style={styles.sectionLabel}>Acceso rápido</Text>
          <TouchableOpacity
            onPress={() => { /* navigate to new diary */ }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[C.forest, C.moss]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryAction}
            >
              <View style={styles.primaryActionLeft}>
                <Text style={styles.primaryActionEmoji}>📓</Text>
                <View>
                  <Text style={styles.primaryActionTitle}>Mi Diario de Alivio</Text>
                  <Text style={styles.primaryActionSub}>Suelta aquí lo que hoy pesa en el cuerpo</Text>
                </View>
              </View>
              <Text style={styles.primaryArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </FadeInView>

        <FadeInView delay={200}>
          <View style={styles.actionRow}>
            <ActionCard
              emoji="💬"
              title="Hablar con Ágora"
              subtitle="Tu acompañante"
              colors={[C.parchment, '#E8E2D8']}
              onPress={() => {}}
            />
            <ActionCard
              emoji="📈"
              title="Mis Patrones"
              subtitle="Ver historial"
              colors={['#EDF0F5', '#E2E8F0']}
              onPress={() => {}}
            />
          </View>
        </FadeInView>

        {/* ── Quote of the Day ── */}
        <FadeInView delay={300}>
          <View style={styles.quoteCard}>
            <View style={styles.quoteMark}>
              <Text style={styles.quoteMarkText}>"</Text>
            </View>
            <Text style={styles.quoteText}>{todayQuote}</Text>
            <View style={styles.quoteLine} />
            <Text style={styles.quoteAuthor}>Reflexión del día</Text>
          </View>
        </FadeInView>

        {/* ── Weekly Pain Chart ── */}
        <FadeInView delay={400}>
          <View style={styles.chartCard}>
            <View style={styles.chartCardHeader}>
              <Text style={styles.chartCardTitle}>Esta semana</Text>
              <View style={styles.avgBadge}>
                <Text style={styles.avgBadgeText}>Media {avgPain}/10</Text>
              </View>
            </View>
            <Text style={styles.chartCardSub}>Registro de tu nivel de dolor</Text>
            <PainChart data={WEEKLY_PAIN} />
          </View>
        </FadeInView>

        {/* ── Encouraging Footer ── */}
        <FadeInView delay={500}>
          <View style={styles.encourageCard}>
            <Text style={styles.encourageEmoji}>🌿</Text>
            <Text style={styles.encourageText}>
              Llevas {WEEKLY_PAIN.length} días registrando. Conocerte es cuidarte.
            </Text>
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },

  // ── Header ──
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: {
    color: C.sage,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  userName: {
    color: C.white,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 6,
  },
  headerQuestion: {
    color: C.mint,
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 18,
  },
  painPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    gap: 8,
  },
  painDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  painPillText: {
    color: C.white,
    fontSize: 13,
    opacity: 0.92,
  },

  // ── Scroll ──
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 22,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },

  // ── Primary Action ──
  primaryAction: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  primaryActionEmoji: { fontSize: 30 },
  primaryActionTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  primaryActionSub: {
    color: C.mint,
    fontSize: 12,
    opacity: 0.9,
  },
  primaryArrow: {
    color: C.white,
    fontSize: 22,
    fontWeight: '300',
  },

  // ── Secondary Actions ──
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  actionCardWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionEmoji: { fontSize: 26, marginBottom: 8 },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.charcoal,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    color: C.textMuted,
  },
  actionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74,102,77,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  actionArrowText: {
    color: C.forest,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Quote ──
  quoteCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: C.sage,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  quoteMark: {
    marginBottom: 4,
  },
  quoteMarkText: {
    fontSize: 48,
    color: C.mint,
    lineHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  quoteText: {
    fontSize: 16,
    color: C.charcoal,
    lineHeight: 26,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
  },
  quoteLine: {
    height: 1,
    backgroundColor: C.mint,
    marginBottom: 10,
    width: 40,
  },
  quoteAuthor: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '500',
  },

  // ── Chart Card ──
  chartCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.charcoal,
  },
  chartCardSub: {
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 18,
  },
  avgBadge: {
    backgroundColor: C.mintLight,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  avgBadgeText: {
    fontSize: 11,
    color: C.forest,
    fontWeight: '600',
  },
  chartContainer: { gap: 16 },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: MAX_BAR_HEIGHT + 40,
    gap: 6,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  chartVal: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
  },
  chartBarTrack: {
    width: '100%',
    height: MAX_BAR_HEIGHT,
    backgroundColor: C.parchment,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  chartBarToday: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chartDay: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: C.textMuted,
  },

  // ── Encourage ──
  encourageCard: {
    backgroundColor: C.mintLight,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.mint,
  },
  encourageEmoji: { fontSize: 22 },
  encourageText: {
    fontSize: 13,
    color: C.forestDim,
    flex: 1,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});