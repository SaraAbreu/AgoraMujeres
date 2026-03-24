import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
  paddingHorizontal?: number;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  backgroundColor = '#80704f',
  paddingHorizontal,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Determine padding based on device
  const getPadding = () => {
    if (paddingHorizontal !== undefined) return paddingHorizontal;
    
    if (isWeb) {
      if (width >= 1024) return 60;
      if (width >= 480) return 40;
    }
    return 16;
  };

  if (isWeb) {
    return (
      <View style={[styles.webRoot, { backgroundColor }]}>
        <View 
          style={[
            styles.webContainer,
            { paddingHorizontal: getPadding() }
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  // Mobile: SafeAreaView with proper insets
  return (
    <SafeAreaView
      style={[styles.mobileRoot, { backgroundColor }]}
      edges={['right', 'bottom', 'left']}
    >
      <View 
        style={[
          styles.mobileContainer,
          { paddingHorizontal: getPadding() }
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // WEB LAYOUT
  webRoot: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },

  webContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },

  // MOBILE LAYOUT
  mobileRoot: {
    flex: 1,
    width: '100%',
  },

  mobileContainer: {
    flex: 1,
    width: '100%',
  },
});