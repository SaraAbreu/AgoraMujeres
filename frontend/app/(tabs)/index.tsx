import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { colors, textStyles, sp, radius, shadows, typography } from '../../src/theme';
import logo from '../../assets/images/logo.png';

// Hook del contador de 2h
function useTrialCountdown(initialSeconds = 7200) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const router = useRouter();

  useEffect(() => {
    if (seconds <= 0) {
      router.push('/paywall' as any);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  const format = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return format();
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const timeLeft = useTrialCountdown();

  const quickActions = [
    { key: 'diary', icon: 'create-outline', label: 'Escribir diario', route: '/diary/new' as const },
    { key: 'chat', icon: 'chatbubble-outline', label: 'Hablar con Agora', route: '/(tabs)/chat' as const },
    { key: 'patterns', icon: 'analytics-outline', label: 'Ver patrones', route: '/(tabs)/patterns' as const },
    { key: 'record', icon: 'calendar-outline', label: 'Registro mensual', route: '/monthly-record' as const },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* LOGO */}
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* CONTADOR DE PRUEBA */}
        <Text style={styles.trialTimer}>
          {timeLeft} de prueba gratuita
        </Text>

        {/* FRASE MOTIVACIONAL */}
        <Text style={styles.motivational}>
          “Estás haciendo lo mejor que puedes. Respira.”
        </Text>

        {/* BOTÓN DE CRISIS */}
        <View style={{ marginHorizontal: sp.screenX, marginTop: sp.md }}>
          <PremiumButton
            title="Necesito ayuda"
            size="lg"
            variant="primary"
            onPress={() => router.push('/crisis' as const)}
          />
        </View>

        {/* ACCIONES RÁPIDAS */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>

        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.key}
              activeOpacity={0.75}
              onPress={() => router.push(a.route)}
              style={styles.actionCardWrap}
            >
              <GlassCard style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  <Ionicons name={a.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>
                  {a.label}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* CITA DEL DÍA */}
        <GlassCard style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>🌿</Text>
          <Text style={styles.quoteText}>
            Recuerda: no tienes que poder con todo hoy.
          </Text>
        </GlassCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },

  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginTop: sp.lg,
    marginBottom: sp.md,
  },

  trialTimer: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: sp.sm,
  },

  motivational: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: sp.xl,
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },

  sectionTitle: {
    ...textStyles.labelCaps,
    color: colors.textMuted,
    marginHorizontal: sp.screenX,
    marginTop: sp.sectionGap,
    marginBottom: sp.md,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: sp.screenX,
    gap: sp.sm,
  },

  actionCardWrap: { width: '48%', flexGrow: 1 },

  actionCard: {
    alignItems: 'center',
    paddingVertical: sp.lg,
    paddingHorizontal: sp.md,
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp.sm,
  },

  actionLabel: {
    ...textStyles.bodySm,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: typography.medium,
  },

  quoteCard: {
    marginHorizontal: sp.screenX,
    marginTop: sp.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
  },

  quoteIcon: { fontSize: 28 },

  quoteText: {
    ...textStyles.body,
    color: colors.textSecondary,
    flex: 1,
    fontStyle: 'italic',
  },
});
