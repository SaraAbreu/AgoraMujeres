import React, { Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

/**
 * Componente para lazy load de screens con loading fallback
 * Mejora el bundle split automáticamente
 */
export const LazyScreen = ({ 
  Component, 
  loadingMessage 
}: { 
  Component: React.ComponentType<any>;
  loadingMessage?: string;
}) => (
  <Suspense
    fallback={
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.warmBrown} />
      </View>
    }
  >
    <Component />
  </Suspense>
);
