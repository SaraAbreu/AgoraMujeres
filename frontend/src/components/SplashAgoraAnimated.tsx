import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';

export default function SplashAgoraAnimated() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      // Fade in del bloque completo
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Respiración suave continua
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.04,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.96,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/*
        UN SOLO bloque animado que contiene logo + texto.
        Al animar este wrapper, logo y texto se mueven exactamente juntos.
      */}
      <Animated.View
        style={[
          styles.block,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* LOGO */}
        <Image
          // require funciona en Android, iOS y Web
          source={require('../../assets/images/logo-silueta.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* TEXTO pegado al logo */}
        <Text style={styles.title}>Ágora Mujeres</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>Cargando tu espacio seguro...</Text>
        <ActivityIndicator
          size="small"
          color="#4A664D"
          style={styles.loader}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pantalla completa centrada
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden' as any,
    marginTop: -80,
  },

  // El bloque único — logo + texto como una sola unidad
  block: {
    alignItems: 'center',
    justifyContent: 'center',
    // Sin width fijo para que se adapte a cualquier pantalla
  },

  logo: {
    width: 600,
    height: 600,
    marginBottom: -160, // Para pegar el texto al logo
  },

  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1A1A1A',
    letterSpacing: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  divider: {
    width: 36,
    height: 1,
    backgroundColor: '#4A664D',
    marginVertical: 14,
    opacity: 0.35,
  },

  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#4A664D',
    letterSpacing: 2,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  loader: {
    marginTop: 28,
  },
});