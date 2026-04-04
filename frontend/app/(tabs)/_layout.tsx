/**
 * (tabs)/_layout.tsx — Navbar con hoja central para el chat
 * CAMBIOS:
 *  - Botón central: hoja 🍃 (Ionicons leaf) en lugar del logo
 *  - Diseño limpio, consistente con la estética Ágora
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
} from '@expo-google-fonts/quicksand';

SplashScreen.preventAutoHideAsync();

const C = {
  forest: '#4A664D',
  moss:   '#6B8F6E',
  mint:   '#D4E8D0',
  muted:  '#9A958E',
  cream:  '#F8F7F2',
  white:  '#FFFFFF',
  border: '#E8E4DC',
};

// ── Tab icon wrapper ──────────────────────────────────────────
function TabIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

// ── Central leaf button ───────────────────────────────────────
function LeafButton({ focused }: { focused: boolean }) {
  return (
    <View style={styles.leafOuter}>
      <LinearGradient
        colors={focused ? [C.forest, C.moss] : ['#5A7A5D', '#7A9F7D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.leafGradient}
      >
        <Ionicons name="leaf" size={26} color={C.white} />
      </LinearGradient>
    </View>
  );
}

// ── Tab bar background ────────────────────────────────────────
function TabBg() {
  if (Platform.OS === 'web') return <View style={[StyleSheet.absoluteFill, styles.bgWeb]} />;
  if (Platform.OS === 'android') return <View style={[StyleSheet.absoluteFill, styles.bgAndroid]} />;
  return <BlurView intensity={80} tint="light" style={[StyleSheet.absoluteFill, styles.bgIOS]} />;
}

// ── Layout ────────────────────────────────────────────────────
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

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
        tabBarActiveTintColor: C.forest,
        tabBarInactiveTintColor: C.muted,
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
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <LeafButton focused={focused} />,
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
  label: { fontFamily: 'Quicksand_500Medium', fontSize: 11, marginTop: -2 },

  iconWrap: { width:40, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
  iconWrapActive: { backgroundColor: '#4A664D18' },

  // Leaf central button
  leafOuter: {
    width: 60, height: 60, borderRadius: 30,
    position: 'absolute',
    left: '50%', marginLeft: -30,
    top: -18,
    shadowColor: '#4A664D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: C.forest,
    overflow: 'hidden',
  },
  leafGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },

  // Tab bar backgrounds
  bgWeb: { backgroundColor: 'rgba(248,247,242,0.94)', borderTopWidth: 1, borderTopColor: '#E8E4DC' },
  bgAndroid: { backgroundColor: '#FDFAF7', borderTopWidth: 1, borderTopColor: '#E8E4DC' },
  bgIOS: { borderTopWidth: 1, borderTopColor: '#E8E4DC' },
});