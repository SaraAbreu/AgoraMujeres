import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, sp, textStyles } from '../../theme';

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  showBack?: boolean;
}

export function ScreenContainer({ children, title, subtitle, headerRight, style, padded = true, showBack = false }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }, style]}>
      {(title || headerRight || showBack) && (
        <View style={[styles.header, padded && styles.padded]}>
          {showBack && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={styles.headerText}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {headerRight}
        </View>
      )}
      <View style={[styles.content, padded && styles.padded]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: sp.md,
  },
  headerText: { flex: 1 },
  padded: { paddingHorizontal: sp.screenX },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...textStyles.bodySm,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: { flex: 1 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sp.sm,
    marginBottom: 2,
  },
});
