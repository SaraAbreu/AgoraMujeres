import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
} from '@expo-google-fonts/quicksand';

import { useUserStore } from '../../src/store/useStore';
import { getSubscriptionStatus } from '../../src/services/api';
SplashScreen.preventAutoHideAsync();

const C = {
  forestDeep: '#2C3D2E',
  forest:     '#4A664D',
  gold:       '#C9A84C',
  white:      '#FFFFFF',
};

function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

function LeafButton() {
  return (
    <View style={styles.leafOuter}>
      <LinearGradient
        colors={['#C9A84C', '#B8963E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.leafGradient}
      >
        <Ionicons name="leaf" size={24} color={C.white} />
        <Text style={styles.leafLabel}>ÁGORA</Text>
      </LinearGradient>
    </View>
  );
}

function TabBg() {
  return <View style={[StyleSheet.absoluteFill, styles.bg]} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deviceId } = useUserStore();

  useEffect(() => {
    if (!deviceId) return;
    getSubscriptionStatus(deviceId).then((data) => {
      if (data.status === 'expired') {
        router.replace('/subscription');
      }
    }).catch(() => {});
  }, [deviceId]);

  const [fontsLoaded, fontError] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => <TabBg />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Refugio',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diario',
          tabBarIcon: ({ color, focused }) => <TabIcon name="book-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Ágora',
          tabBarLabel: () => null,
          tabBarIcon: () => <LeafButton />,
        }}
      />
      <Tabs.Screen
        name="patterns"
        options={{
          title: 'Patrones',
          tabBarIcon: ({ color, focused }) => <TabIcon name="analytics-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => <TabIcon name="settings-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 11,
    marginTop: -2,
  },
  iconWrap: {
    width: 40, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  leafOuter: {
    width: 70, height: 70, borderRadius: 35,
    position: 'absolute',
    left: '50%' as any, marginLeft: -35,
    top: -24,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  leafGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  leafLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bg: {
    backgroundColor: '#2C3D2E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
});
