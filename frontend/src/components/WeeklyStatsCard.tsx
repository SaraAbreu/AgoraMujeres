import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_COLORS, spacing, borderRadius } from '../theme/colors';

interface WeeklyStatsCardProps {
  deviceId: string;
}

// Versión simplificada y robusta - placeholder para stats semanales
export function WeeklyStatsCard({ deviceId }: WeeklyStatsCardProps) {
  const stats = {
    entries: 5,
    mood: '💚 Tranquila',
    trend: '↗ Mejorando',
    insight: 'Esta semana has estado más activa',
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="bar-chart-outline" size={20} color="#80704F" />
        <Text style={styles.title}>Esta semana</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Entradas</Text>
          <Text style={styles.statValue}>{stats.entries}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ánimo</Text>
          <Text style={styles.statValue}>{stats.mood}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tendencia</Text>
          <Text style={styles.statValue}>{stats.trend}</Text>
        </View>
      </View>

      <View style={styles.insight}>
        <Ionicons name="lightbulb-outline" size={16} color="#7A9B8E" />
        <Text style={styles.insightText}>{stats.insight}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D2B1A',
    fontFamily: 'Cormorant_700Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: '#B5A997',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D2B1A',
    fontFamily: 'Nunito_600SemiBold',
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(122,155,142,0.05)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  insightText: {
    fontSize: 12,
    color: '#7A9B8E',
    fontFamily: 'Nunito_400Regular',
    flex: 1,
  },
});
