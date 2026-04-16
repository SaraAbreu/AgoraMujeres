import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#8B5A2B',
      tabBarInactiveTintColor: 'rgba(139, 90, 43, 0.3)',
      tabBarShowLabel: true,
      tabBarLabelStyle: styles.label,
      tabBarStyle: styles.tabBar,
    }}>
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'INICIO',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="diario"
        options={{
          title: 'DIARIO',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'ÁGORA',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeChatIcon : styles.chatIcon}>
               <Ionicons name="mic" size={22} color={focused ? 'white' : color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'PERFIL',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* OCULTAR CUALQUIER OTRA PESTAÑA AUTOMÁTICA */}
      <Tabs.Screen
        name="two" 
        options={{ href: null }}
      />
      <Tabs.Screen
        name="index" // Por si acaso tienes un index.tsx aparte
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 35,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#8B5A2B',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    paddingTop: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  chatIcon: { padding: 5 },
  activeChatIcon: {
    backgroundColor: '#8B5A2B',
    padding: 8,
    borderRadius: 15,
    marginTop: -5,
  }
});