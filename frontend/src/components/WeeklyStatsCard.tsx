import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPO } from '../theme';

interface WeeklyStatsCardProps {
  deviceId: string;
}

export function WeeklyStatsCard({ deviceId }: WeeklyStatsCardProps) {
  const stats = {
    entries: 5,
    mood: '💚',
    insight: 'Esta semana has estado equilibrada',
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Esta semana</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Entradas</Text>
          <Text style={styles.statValue}>{stats.entries}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Ánimo</Text>
          <Text style={styles.statValue}>{stats.mood}</Text>
        </View>
      </View>

      <View style={styles.insight}>
        <Text style={styles.insightText}>✨ {stats.insight}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPO.h3,
    color: COLORS.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...TYPO.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...TYPO.h2,
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  insight: {
    backgroundColor: COLORS.primarySoft + '10',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  insightText: {
    ...TYPO.bodySmall,
    color: COLORS.textPrimary,
  },
});
