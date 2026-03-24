import { FC } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { getThemeColors } from '../theme/colors';

/**
 * Skeleton loading components for showing loading states
 * Provides better UX than simple spinners
 */

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

/**
 * Basic skeleton box component
 */
export const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#2A2A2A' : '#E8E5E0',
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton for text/heading
 */
export const SkeletonText = ({
  width = '100%',
  height = 16,
  ...props
}: SkeletonProps) => <Skeleton width={width} height={height} {...props} />;

/**
 * Skeleton for avatar/profile picture
 */
export const SkeletonAvatar = ({
  width = 48,
  height = 48,
  ...props
}: SkeletonProps) => <Skeleton width={width} height={height} borderRadius={24} {...props} />;

/**
 * Skeleton for card/container
 */
export const SkeletonCard = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#2A2A2A' : '#F5F3F0',
          borderColor: colors.border,
        },
      ]}
    >
      <SkeletonText width="70%" height={20} style={{ marginBottom: 12 }} />
      <SkeletonText width="100%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonText width="90%" height={16} />
    </View>
  );
};

/**
 * Skeleton for a list of items
 */
export const SkeletonList = ({ count = 5 }: { count?: number }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
};

/**
 * Skeleton for a diary entry
 */
export const SkeletonDiaryEntry = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#2A2A2A' : '#F5F3F0',
        },
      ]}
    >
      <View style={{ marginBottom: 12 }}>
        <SkeletonText width="40%" height={14} />
      </View>
      <SkeletonText width="100%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonText width="95%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonText width="80%" height={16} />
      <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
        <Skeleton width={60} height={24} borderRadius={4} />
        <Skeleton width={60} height={24} borderRadius={4} />
        <Skeleton width={60} height={24} borderRadius={4} />
      </View>
    </View>
  );
};

/**
 * Skeleton for chat message
 */
export const SkeletonChatMessage = ({ isUser = false }: { isUser?: boolean }) => {
  return (
    <View
      style={{
        marginBottom: 12,
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <Skeleton
        width={isUser ? '70%' : '80%'}
        height={60}
        borderRadius={12}
      />
    </View>
  );
};

/**
 * Skeleton for search/filter header
 */
export const SkeletonSearchHeader = () => {
  return (
    <View style={{ padding: 16 }}>
      <SkeletonText width="100%" height={40} borderRadius={12} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
