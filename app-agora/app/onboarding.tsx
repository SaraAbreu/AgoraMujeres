// app/onboarding.tsx (Concepto Innovador)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

export default function InnovativeOnboarding() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#FDFCFB', '#F5F0E8']} style={styles.container}>
      <Animated.View entering={FadeIn.delay(500)} style={styles.header}>
        <Text style={styles.brand}>ÁGORA BY SYNTEXIA</Text>
      </Animated.View>

      <View style={styles.centerStage}>
        {/* El "Reloj de Arena" Digital */}
        <View style={styles.timerVisual}>
          <Text style={styles.timerNumber}>90:00</Text>
          <Text style={styles.timerLabel}>MINUTOS DE LUZ</Text>
        </View>

        <Animated.View entering={SlideInDown.delay(800)} style={styles.textBlock}>
          <Text style={styles.mainTitle}>Un regalo de tiempo.</Text>
          <Text style={styles.description}>
            Tienes 1h 30min para explorar el santuario. {"\n"}
            Este tiempo no se detiene, es tu viaje inicial.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.primaryBtnText}>RECLAMAR MI TIEMPO</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => Linking.openURL('https://agoramujeres.syntexia-solutions.es/')}
        >
          <Text style={styles.planLink}>Ver Plan Áurea (7.90€)</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: 60 },
  header: { alignItems: 'center' },
  brand: { letterSpacing: 8, fontSize: 12, color: '#C5A059', fontWeight: '300' },
  centerStage: { alignItems: 'center' },
  timerVisual: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 0.5, borderColor: '#C5A059',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#C5A059', shadowOpacity: 0.1, shadowRadius: 20
  },
  timerNumber: { fontSize: 48, fontWeight: '100', color: '#8B5A2B', letterSpacing: 5 },
  timerLabel: { fontSize: 10, color: '#C5A059', letterSpacing: 3, marginTop: 5 },
  textBlock: { alignItems: 'center', marginTop: 50, paddingHorizontal: 40 },
  mainTitle: { fontSize: 28, color: '#8B5A2B', fontWeight: '300', textAlign: 'center' },
  description: { textAlign: 'center', marginTop: 20, color: '#8B5A2B', opacity: 0.6, lineHeight: 24, fontSize: 15 },
  footer: { alignItems: 'center', gap: 20 },
  primaryBtn: { 
    backgroundColor: '#8B5A2B', paddingHorizontal: 40, paddingVertical: 20, 
    borderRadius: 35, width: '80%', alignItems: 'center', elevation: 10 
  },
  primaryBtnText: { color: '#FFF', letterSpacing: 4, fontSize: 12, fontWeight: 'bold' },
  planLink: { color: '#C5A059', fontSize: 13, textDecorationLine: 'underline' }
});