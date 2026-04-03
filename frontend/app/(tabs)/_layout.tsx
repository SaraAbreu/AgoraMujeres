// ============================================================
//  _layout.tsx — CORREGIDO (compatibilidad Android / iOS / Web)
//  BUGS RESUELTOS:
//  [BUG-4] tabBarBackground con BlurView definida pero NUNCA USADA.
//          La inline de screenOptions (línea 89 original) no tenía
//          Platform check ni BlurView. Ahora hay un único componente
//          TabBarBackground con lógica correcta por plataforma.
//  [BUG-10] Imports Text y sp eliminados (no se usaban → warning TS)
// ============================================================

import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../../src/theme';

import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
} from '@expo-google-fonts/quicksand';

SplashScreen.preventAutoHideAsync();

// ─── Tipos ───────────────────────────────────────────────────
type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
};

// ─── Componentes auxiliares ───────────────────────────────────
function TabBarIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

function AgoraButton({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.agoraBtn, focused && styles.agoraBtnActive]}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.agoraLogo}
        resizeMode="cover"
      />
    </View>
  );
}

// ─── Fondo de la TabBar ───────────────────────────────────────
// [BUG-4 FIX] En el archivo original existían DOS tabBarBackground:
//   1. La const `tabBarBackground` (línea 66) con BlurView y Platform check → NUNCA SE USABA
//   2. La función inline dentro de screenOptions (línea 89) → SIN BlurView NI Platform check
//
// Solución: un único componente nombrado con lógica clara por plataforma.
// Componente nombrado (no arrow anónima) para evitar re-renders innecesarios.
function TabBarBackground() {
  if (Platform.OS === 'web') {
    // Web: fondo semi-transparente con backdrop-filter vía estilo
    return <View style={[StyleSheet.absoluteFill, styles.tabBgWeb]} />;
  }

  if (Platform.OS === 'android') {
    // Android: BlurView es poco fiable (depende del hardware y de la versión de Android).
    // Usamos un fondo sólido con opacidad como fallback seguro.
    // Si quieres probar BlurView en Android igualmente, envuélvelo en un try/catch
    // de renderizado con un ErrorBoundary, pero NO es recomendable para producción.
    return <View style={[StyleSheet.absoluteFill, styles.tabBgAndroid]} />;
  }

  // iOS: BlurView funciona perfectamente y da el efecto "frosted glass" nativo
  return (
    <BlurView
      intensity={80}
      tint="light"
      style={[StyleSheet.absoluteFill, styles.tabBgNative]}
    />
  );
}

// ─── Layout principal ─────────────────────────────────────────
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Mientras las fuentes cargan, no renderizamos nada para que el
  // SplashScreen permanezca visible (no hay FOUC en móvil ni en web).
  if (!fontsLoaded && !fontError) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom,
          // Transparente para que TabBarBackground sea visible
          backgroundColor: 'transparent',
        },
        // [BUG-4 FIX] Usamos el componente unificado con lógica por plataforma
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Refugio',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diario',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="book-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Ágora',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <AgoraButton focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="patterns"
        options={{
          title: 'Patrones',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="analytics-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings-outline" color={color} focused={focused} />
          ),
        }}
      />

      {/* Pantalla de onboarding: excluida de la tab bar */}
      <Tabs.Screen
        name="onboarding"
        options={{ href: null }}
      />
    </Tabs>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabLabel: {
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: -2,
  },

  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },

  agoraBtn: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: -28,
    borderWidth: 3,
    borderColor: colors.bg,
    zIndex: 10,
    backgroundColor: colors.bg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  agoraBtnActive: {
    borderColor: colors.primary,
  },
  agoraLogo: {
    width: 72,
    height: 72,
  },

  // Fondos de la tab bar por plataforma
  tabBgWeb: {
    backgroundColor: 'rgba(250,246,240,0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  tabBgAndroid: {
    // Fondo sólido en Android: más fiable que BlurView en este OS
    backgroundColor: '#FDFAF7',
    borderTopWidth: 1,
    borderTopColor: '#E8E7C3',
  },
  tabBgNative: {
    // iOS: el BlurView proporciona el efecto real; solo necesita el borde
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
