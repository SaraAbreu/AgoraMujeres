import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, radius, sp, textStyles, shadows } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PremiumButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  style,
  textStyle,
}: Props) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyle = sizeStyles[size];
  const opacity = disabled ? 0.5 : 1;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={disabled || loading}
        style={[{ opacity }, style]}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, sizeStyle.container, shadows.md]}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.textPrimary, sizeStyle.text, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[styles.base, sizeStyle.container, variantStyle.container, { opacity }, style]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[sizeStyle.text, { color: variantStyle.textColor, ...textStyles.button }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'center',
    gap: sp.sm,
  },
  textPrimary: {
    ...textStyles.button,
    color: colors.textOnPrimary,
  },
});

const sizeStyles = {
  sm: {
    container: { paddingVertical: 10, paddingHorizontal: sp.md, borderRadius: radius.md } as ViewStyle,
    text:      { fontSize: 13 } as TextStyle,
  },
  md: {
    container: { paddingVertical: 14, paddingHorizontal: sp.lg, borderRadius: radius.lg } as ViewStyle,
    text:      { fontSize: 15 } as TextStyle,
  },
  lg: {
    container: { paddingVertical: 18, paddingHorizontal: sp.xl, borderRadius: radius.xl } as ViewStyle,
    text:      { fontSize: 17 } as TextStyle,
  },
};

const variantStyles = {
  secondary: {
    container: { backgroundColor: colors.primarySoft } as ViewStyle,
    textColor: colors.primary,
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary } as ViewStyle,
    textColor: colors.primary,
  },
  ghost: {
    container: { backgroundColor: 'transparent' } as ViewStyle,
    textColor: colors.primary,
  },
};
