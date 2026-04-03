import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image, // IMPORTANTE: Mantenemos el import de Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      
      {/* 🟢 Círculo contenedor - El "hueco" verde clarito */}
      <View style={styles.logoCircle}>
        {/* LOGO GIGANTE - Que abarca todo */}
        <Image 
          source={require('../../assets/images/logo-silueta.png')} // Revisa que la ruta sea esta
          style={styles.logoImage}
          resizeMode="contain" // "contain" asegura que se vea entero sin cortarse
        />
      </View>

      <Text style={styles.title}>Agora Mujeres</Text>
      
      <View style={styles.divider} />
      
      <Text style={styles.description}>
        Un refugio para mujeres que viven con dolor cronico.{'\n'}
        Aqui no tienes que explicarte.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(auth)/login')}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Empezar mi camino</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7', // Fondo crema suave
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoCircle: {
    width: 170,           // ⬆️ Subimos de 160 a 170 para más presencia
    height: 170,
    borderRadius: 85,     // Mitad del ancho para círculo perfecto
    backgroundColor: '#EAF3DE', // El verde clarito de fondo (image_9.png)
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    overflow: 'hidden',     // Un pelín más de espacio abajo
    // Sombra sutil para que flote
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    transform: [
      { scale: 2.1 },    // El tamaño que rellena el círculo
      { translateY: 5 }  // Esto baja la silueta 5 píxeles si ves que se corta la cabeza
    ], 
  },
  title: {
    fontSize: 28,
    fontWeight: '300', // Tipografía fina = Premium
    color: '#2D3E2D',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 14,
  },
  divider: {
    width: 30,
    height: 1,
    backgroundColor: '#4A664D',
    opacity: 0.35,
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: '#7A8E7A',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 52,
  },
  button: {
    width: '100%',
    backgroundColor: '#4A664D', // El verde oscuro de Ágora
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    // Sombra para el botón
    shadowColor: "#4A664D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
});