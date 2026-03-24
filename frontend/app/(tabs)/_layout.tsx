import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';

const isWeb = Platform.OS === 'web';

// ─────────────────────────────────────────────────────────────
// Custom Tab Bar Component
// ─────────────────────────────────────────────────────────────
function CustomTabBar() {
  return <View />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: isWeb ? 70 : 80,
          backgroundColor: '#FDFBF9',
          borderTopWidth: 1,
          borderTopColor: '#D4C9B9',
          paddingBottom: isWeb ? 12 : 16,
          paddingTop: 12,
          paddingHorizontal: isWeb ? 20 : 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: isWeb ? 12 : 13,
          fontWeight: '600',
          marginTop: isWeb ? 6 : 4,
          marginBottom: 0,
          fontFamily: 'Nunito_600SemiBold',
        },
        tabBarIconStyle: {
          marginBottom: isWeb ? 2 : 2,
        },
        tabBarActiveTintColor: '#80704F',
        tabBarInactiveTintColor: '#B5A997',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={isWeb ? 22 : 26} 
              color={color}
              style={{ fontWeight: focused ? 'bold' : 'normal' }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Ágora',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'chatbubble' : 'chatbubble-outline'} 
              size={isWeb ? 22 : 26} 
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diario',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'book' : 'book-outline'} 
              size={isWeb ? 22 : 26} 
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="patterns"
        options={{
          title: 'Patrones',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'analytics' : 'analytics-outline'} 
              size={isWeb ? 22 : 26} 
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}