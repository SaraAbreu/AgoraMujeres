import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, sp, textStyles, radius } from '../../theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={colors.primaryLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp.xl,
    paddingBottom: sp.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp.lg,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: sp.sm,
  },
  message: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
