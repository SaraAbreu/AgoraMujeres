import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WebLanding() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* NAVEGACIÓN */}
        <View style={styles.nav}>
          <Text style={styles.logo}>SYNTEXIA SOLUTIONS</Text>
          <TouchableOpacity style={styles.btnApp} onPress={() => Linking.openURL('https://tu-enlace.es')}>
            <Text style={styles.btnAppText}>DESCARGAR APP</Text>
          </TouchableOpacity>
        </View>

        {/* HERO SECTION */}
        <View style={styles.hero}>
          <Text style={styles.mainTitle}>ÁGORA</Text>
          <Text style={styles.subTitle}>SANTUARIO DIGITAL</Text>
          <Text style={styles.manifesto}>
            El espacio donde la tecnología se encuentra con la calma orgánica.{"\n"}
            Diseñado para la reconexión de la mujer contemporánea.
          </Text>
        </View>

        {/* CONTENEDOR DE PLANES (HORIZONTAL EN WEB) */}
        <View style={[styles.plansWrapper, isWeb && styles.plansRow]}>
          <View style={styles.card}>
            <Text style={styles.cardTag}>CÍRCULO ESENCIA</Text>
            <Text style={styles.price}>0€</Text>
            <Text style={styles.cardInfo}>90 minutos de cortesía para explorar el santuario.</Text>
            <TouchableOpacity style={styles.cardBtn} onPress={() => router.replace('/login')}>
              <Text style={styles.cardBtnText}>CONTINUAR EN WEB</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient colors={['#C5A059', '#8B5A2B']} style={styles.cardPremium}>
            <Text style={[styles.cardTag, {color: 'white'}]}>CÍRCULO ÁUREA</Text>
            <Text style={[styles.price, {color: 'white'}]}>7.90€</Text>
            <Text style={[styles.cardInfo, {color: 'white'}]}>Acceso infinito, IA emocional y comunidad exclusiva.</Text>
            <TouchableOpacity style={styles.cardBtnWhite} onPress={() => router.replace('/login')}>
              <Text style={styles.cardBtnTextGold}>SUSCRIBIRME</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100, alignItems: 'center' },
  nav: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', padding: 40, paddingHorizontal: 60 },
  logo: { letterSpacing: 5, fontWeight: 'bold', color: '#8B5A2B', fontSize: 12 },
  btnApp: { backgroundColor: '#8B5A2B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  btnAppText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  hero: { alignItems: 'center', marginVertical: 80, paddingHorizontal: 20 },
  mainTitle: { fontSize: width > 800 ? 150 : 80, fontWeight: '100', letterSpacing: 30, color: '#C5A059' },
  subTitle: { fontSize: 18, letterSpacing: 10, color: '#8B5A2B', marginTop: -20, fontWeight: '300' },
  manifesto: { textAlign: 'center', marginTop: 40, fontSize: 18, color: '#8B5A2B', lineHeight: 30, maxWidth: 700, fontWeight: '200' },
  plansWrapper: { width: '100%', paddingHorizontal: 20, gap: 30, alignItems: 'center' },
  plansRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch' },
  card: { width: 350, padding: 40, backgroundColor: 'white', borderRadius: 30, alignItems: 'center', justifyContent: 'space-between', minHeight: 450 },
  cardPremium: { width: 360, padding: 40, borderRadius: 30, alignItems: 'center', justifyContent: 'space-between', minHeight: 450 },
  cardTag: { fontSize: 11, letterSpacing: 3, fontWeight: 'bold', color: '#C5A059' },
  price: { fontSize: 50, fontWeight: '100', color: '#8B5A2B', marginVertical: 20 },
  cardInfo: { textAlign: 'center', color: '#8B5A2B', fontSize: 15, lineHeight: 22, opacity: 0.7 },
  cardBtn: { borderBottomWidth: 1, borderColor: '#C5A059' },
  cardBtnText: { color: '#C5A059', fontWeight: 'bold', fontSize: 12 },
  cardBtnWhite: { backgroundColor: 'white', width: '100%', padding: 15, borderRadius: 25, alignItems: 'center' },
  cardBtnTextGold: { color: '#8B5A2B', fontWeight: 'bold' }
});