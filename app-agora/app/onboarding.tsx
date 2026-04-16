import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function EditorialOnboarding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 1. FONDO ORGÁNICO DE LA LANDING */}
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />

      {/* 2. LOGO EN MARCA DE AGUA (Esencia Landing) */}
      <Animated.Image 
        source={require('../assets/images/logo2.png')} 
        style={styles.bgLogo}
        resizeMode="contain"
      />

      <View style={styles.content}>
        
        {/* 3. CABECERA BRANDING */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.header}>
          <Text style={styles.brandingTech}>SYNTEXIA Solutions</Text>
        </Animated.View>

        <View style={styles.main}>
          {/* 4. EL NÚMERO Y EL TÍTULO (Estilo Landing) */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.heroGroup}>
            <View style={styles.timerRow}>
              <Text style={styles.bigNumber}>90</Text>
              <Text style={styles.minutesLabel}>minutos</Text>
            </View>
            <Text style={styles.titleAgora}>ÁGORA</Text>
            <Text style={styles.titleMujeres}>mujeres</Text>
          </Animated.View>

          {/* 5. MANIFIESTO CORTO */}
          <Animated.View entering={FadeInDown.delay(900)} style={styles.manifestoWrapper}>
            <View style={styles.line} />
            <Text style={styles.description}>
              Un obsequio de consciencia. {"\n"}
              Tu santuario está listo para recibir tu voz.
            </Text>
          </Animated.View>
        </View>

        {/* 6. ACCIÓN: EL BOTÓN DE CRISTAL (Glassmorphism) */}
        <Animated.View entering={SlideInDown.delay(1200)} style={styles.footer}>
          <TouchableOpacity 
            style={styles.glassButton} 
            onPress={() => router.replace('/home')}
            activeOpacity={0.8}
          >
            {/* Efecto Glass sutil */}
            <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
            <Text style={styles.buttonText}>RECLAMAR MI TIEMPO</Text>
            <Ionicons name="chevron-forward" size={18} color="#8B5A2B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.planLink} onPress={() => router.replace('../plan')}>
            <Text style={styles.planText}>DESCUBRIR PLAN ÁUREA · 7.90€</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Marca de agua de la landing
  bgLogo: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    alignSelf: 'center',
    top: height * 0.1,
    opacity: 0.05, // Muy sutil
  },

  content: { flex: 1, justifyContent: 'space-between', paddingVertical: 80 },

  header: { alignItems: 'center', opacity: 0.6 },
  brandingTech: { letterSpacing: 10, fontSize: 10, color: '#8B5A2B', fontWeight: 'bold' },

  main: { paddingHorizontal: 40, alignItems: 'center' },
  
  heroGroup: { alignItems: 'center', marginTop: 40 },
  timerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  bigNumber: { fontSize: 120, fontWeight: '100', color: '#C5A059', letterSpacing: -5 },
  minutesLabel: { fontSize: 20, fontWeight: '300', color: '#8B5A2B', fontStyle: 'italic' },
  
  // Títulos exactos de la Landing
  titleAgora: { 
    fontSize: 60, fontWeight: '100', letterSpacing: 15, color: '#C5A059', textAlign: 'center', marginTop: -20 
  },
  titleMujeres: { 
    fontSize: 40, fontWeight: '100', color: '#8B5A2B', textAlign: 'center', marginTop: -15,
    fontFamily: isWeb ? 'Georgia, serif' : 'System', fontStyle: 'italic'
  },

  manifestoWrapper: { marginTop: 50, alignItems: 'center' },
  line: { width: 30, height: 1, backgroundColor: '#C5A059', marginBottom: 25, opacity: 0.5 },
  description: { 
    textAlign: 'center', fontSize: 18, color: '#8B5A2B', fontWeight: '200', lineHeight: 28, maxWidth: 300 
  },

  footer: { paddingHorizontal: 40, alignItems: 'center' },
  glassButton: {
    width: '100%',
    height: 70,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    elevation: 5,
    shadowColor: '#8B5A2B',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    // En web aplicaríamos backdrop-filter blur si fuera posible fácilmente
  },
  buttonText: { color: '#8B5A2B', fontWeight: 'bold', letterSpacing: 3, fontSize: 11 },

  planLink: { marginTop: 30 },
  planText: { fontSize: 10, letterSpacing: 3, color: '#C5A059', fontWeight: 'bold' }
});