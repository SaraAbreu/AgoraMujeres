import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, sp, shadows } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  noPadding?: boolean;
}

/**
 * Tarjeta con efecto glass-morphism premium.
 * En web usa fondo translúcido + blur.
 * En nativo usa BlurView.
 */
export function GlassCard({ children, style, intensity = 40, noPadding }: Props) {
  const padding = noPadding ? 0 : sp.cardX;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.cardWeb, { padding }, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint="light"
      style={[styles.cardNative, { padding }, style]}
    >
      {children}
    </BlurView>
  );
}

const webExtra: ViewStyle & Record<string, any> = {
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const styles = StyleSheet.create({
  cardWeb: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
    ...webExtra,
  } as any,
  cardNative: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
});
