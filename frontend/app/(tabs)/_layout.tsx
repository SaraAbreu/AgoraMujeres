import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, sp, typography } from '../../src/theme';

type TabIcon = { color: string; focused: boolean };

function TabBarIcon({
  name,
  color,
  focused,
}: TabIcon & { name: keyof typeof Ionicons.glyphMap }) {
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

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const tabBarBackground = () =>
    Platform.OS === 'web' ? (
      <View style={[StyleSheet.absoluteFill, styles.tabBgWeb]} />
    ) : (
      <BlurView
        intensity={80}
        tint="light"
        style={[StyleSheet.absoluteFill, styles.tabBgNative]}
      />
    );

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
          backgroundColor: 'transparent',
        },
        tabBarBackground,
      }}
    >
      <Tabs.Screen
        name="index"
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
            <TabBarIcon
              name="analytics-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="settings-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="onboarding"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

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

  tabBgWeb: {
    backgroundColor: 'rgba(250,246,240,0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  tabBgNative: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
