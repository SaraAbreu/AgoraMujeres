import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false, // Mata el "Tab One"
      tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : { backgroundColor: '#FDFCFB' }, // Oculta la barra en web
    }}>
      {/* Cambiamos index por home para que coincida con tu nuevo nombre */}
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="two" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}