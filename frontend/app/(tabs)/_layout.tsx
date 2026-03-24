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
          height: isWeb ? 80 : 80,
          backgroundColor: '#FDFBF9',
          borderTopWidth: 2,
          borderTopColor: '#80704F',
          paddingBottom: isWeb ? 16 : 16,
          paddingTop: 14,
          paddingHorizontal: isWeb ? 40 : 12,
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: isWeb ? 13 : 13,
          fontWeight: '700',
          marginTop: isWeb ? 8 : 6,
          marginBottom: 0,
          fontFamily: 'Nunito_700Bold',
          color: '#80704F',
        },
        tabBarIconStyle: {
          marginBottom: isWeb ? 4 : 3,
        },
        tabBarActiveTintColor: '#80704F',
        tabBarInactiveTintColor: '#A0907F',
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