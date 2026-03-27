import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

interface Props {
  children: React.ReactNode;
  variant?: 'default' | 'warm' | 'hero';
  style?: ViewStyle;
}

export function GradientBackground({ children, variant = 'default', style }: Props) {
  const gradientColors = colors.gradient[variant === 'default' ? 'primary' : variant];

  return (
    <LinearGradient colors={gradientColors as any} style={[styles.fill, style]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
