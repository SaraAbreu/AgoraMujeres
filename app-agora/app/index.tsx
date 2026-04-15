import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Platform, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Lógica de Responsividad Tech
const isWeb = Platform.OS === 'web';
const basePadding = isWeb ? 100 : 25;

export default function EditorialLandingFinal() {
  const router = useRouter();
  
  // Parallax del logo: sutil movimiento con el ratón (Solo Web)
  const mX = useSharedValue(0);
  const mY = useSharedValue(0);

  const onMove = (e: any) => {
    if (isWeb) {
      mX.value = (e.clientX - width / 2) / 60;
      mY.value = (e.clientY - height / 2) / 60;
    }
  };

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(mX.value) }, { translateY: withSpring(mY.value) }],
  }));

  return (
    <View style={styles.container} onPointerMove={onMove}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* FONDO ORGÁNICO */}
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      
      {/* LOGO MARCA DE AGUA: Ahora más grande y visible (12% opacidad) */}
      <Animated.Image 
        source={require('../assets/images/logo2.png')} 
        style={[styles.bgLogo, logoStyle]}
        resizeMode="contain"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* NAV ULTRA-SLIM */}
        <View style={styles.navBar}>
          <Text style={styles.brandingTech}>SYNTEXIA Solutions</Text>
          <TouchableOpacity style={styles.navAction} onPress={() => Linking.openURL('https://tu-enlace.es')}>
            <Text style={styles.navActionText}>OBTENER APP</Text>
          </TouchableOpacity>
        </View>

        {/* HERO SECTION: TIPOGRAFÍA DE AUTOR EQUILIBRADA */}
        <View style={styles.heroSection}>
          <Animated.View entering={FadeIn.delay(300)}>
            
            <Text style={styles.titleAgora}>ÁGORA</Text>
            
            {/* mujeres: Ahora perfectamente centrado y escalado */}
            <Text style={styles.titleMujeres}>mujeres</Text>

          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800)} style={styles.manifestoWrapper}>
            <View style={styles.manifestoLine} />
            <Text style={styles.manifestoText}>
              El refugio digital donde el <Text style={styles.italic}>silencio</Text> se convierte en tu mayor activo.
            </Text>
          </Animated.View>
        </View>

        {/* INTERACCIÓN DE LUJO: LAS PUERTAS AL SANTUARIO (Glassmorphism Pro) */}
        <View style={styles.actionSection}>
          <View style={[styles.glassCápsula, isWeb && styles.pricingRowWeb]}>
            
            {/* Puerta 1: Círculo Esencia (Web) */}
            <TouchableOpacity style={styles.actionDoor} onPress={() => router.push('/login')}>
              <Text style={styles.cardLabel}>UMBRAL WEB</Text>
              <Text style={styles.cardMainTitle}>Círculo Esencia</Text>
              <Text style={styles.cardDesc}>Inicie su viaje con 90 minutos de cortesía orgánica.</Text>
              <View style={styles.circleDownload}>
                <Ionicons name="chevron-forward" size={18} color="#C5A059" />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Puerta 2: Círculo Áurea (App Premium) */}
            <TouchableOpacity 
                style={styles.actionDoorPremium} 
                onPress={() => Linking.openURL('https://tu-enlace.es')}
            >
              <LinearGradient colors={['rgba(139, 90, 43, 0.08)', 'rgba(197, 160, 89, 0.15)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.cardLabelGold}>SANTUARIO TOTAL</Text>
              <Text style={styles.cardMainTitleGold}>App Nativa</Text>
              <Text style={styles.cardDescGold}>IA de acompañamiento y acceso infinito al santuario.</Text>
              <View style={styles.goldActionPill}>
                <Text style={styles.goldPillText}>DESCARGAR AHORA</Text>
                <Ionicons name="cloud-download-outline" size={14} color="white" />
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* FOOTER: Firma de calidad Tech */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>MMXXVI · SYNTEXIA SOLUTIONS · ÁGORA</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  
  // LOGO MARCA DE AGUA POTENCIADO
  bgLogo: {
    position: 'absolute', 
    width: isWeb ? width * 0.7 : width * 0.9, 
    height: isWeb ? width * 0.7 : width * 0.9,
    alignSelf: 'center', 
    top: isWeb ? height * 0.15 : height * 0.1, 
    opacity: 0.12, // Ahora es el doble de visible (12%)
  },
  
  scroll: { paddingBottom: 100 },
  
  // NAV BAR ULTRA-LIMPIA
  navBar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: basePadding, paddingVertical: 50 
  },
  brandingTech: { letterSpacing: 10, fontSize: 11, color: '#8B5A2B', fontWeight: 'bold' },
  navAction: { borderBottomWidth: 1, borderColor: '#8B5A2B', paddingBottom: 5 },
  navActionText: { fontSize: 10, fontWeight: 'bold', color: '#8B5A2B', letterSpacing: 2 },
  
  // HERO SECTION EQUILIBRADA
  heroSection: { height: height * 0.65, justifyContent: 'center', alignItems: 'center' },
  titleAgora: { 
    fontSize: isWeb ? 180 : 80, fontWeight: '100', 
    letterSpacing: isWeb ? 55 : 20, color: '#C5A059', textAlign: 'center' 
  },
  
  // mujeres: Ahora con Serif elegante, centrado y con peso 100
  titleMujeres: { 
    fontSize: isWeb ? 110 : 50, 
    fontWeight: '100', // Tipografía ultra-ligera y fina para "susurrar" elegancia
    letterSpacing: isWeb ? 30 : 12, 
    color: '#8B5A2B', 
    textAlign: 'center', // Alineación perfectamente centrada
    width: '100%',
    marginTop: isWeb ? -70 : -25,
    opacity: 0.9,
    ...Platform.select({
      web: { 
        fontFamily: 'Georgia, serif', // Usamos fuente serif elegante en web
      }
    }),
    textTransform: 'lowercase' // Mantenemos el look de tu captura
  },
  
  manifestoWrapper: { marginTop: 60, alignItems: 'center', maxWidth: 650, paddingHorizontal: 20 },
  manifestoLine: { width: 40, height: 1, backgroundColor: '#C5A059', marginBottom: 30, opacity: 0.5 },
  manifestoText: { textAlign: 'center', fontSize: 24, color: '#8B5A2B', fontWeight: '200', lineHeight: 42 },
  italic: { fontStyle: 'italic', fontWeight: '400' },

  // INTERACCIÓN DE LUJO (LAYOUT CÁPSULA)
  actionSection: { paddingHorizontal: basePadding, marginTop: 40 },
  glassCápsula: { 
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
    ...Platform.select({
      web: { backdropFilter: 'blur(30px)' } // Efecto cristal orgánico en web
    }),
  },
  pricingRowWeb: { flexDirection: 'row' },
  
  actionDoor: { flex: 1, padding: 70, alignItems: 'center', justifyContent: 'center' },
  actionDoorPremium: { flex: 1, padding: 70, alignItems: 'center', justifyContent: 'center' },
  
  // Separador elegante
  divider: { 
    width: isWeb ? 1 : '80%', height: isWeb ? undefined : 1, 
    backgroundColor: 'rgba(139, 90, 43, 0.1)', 
    alignSelf: 'center', 
    marginVertical: isWeb ? 60 : 30 
  },
  
  cardLabel: { fontSize: 10, letterSpacing: 5, color: '#C5A059', fontWeight: 'bold', marginBottom: 25 },
  cardLabelGold: { fontSize: 10, letterSpacing: 5, color: '#8B5A2B', fontWeight: 'bold', marginBottom: 25 },
  cardMainTitle: { fontSize: 36, fontWeight: '100', color: '#8B5A2B', marginBottom: 15 },
  cardMainTitleGold: { fontSize: 36, fontWeight: '100', color: '#8B5A2B', marginBottom: 15 },
  cardDesc: { textAlign: 'center', color: '#8B5A2B', opacity: 0.6, fontSize: 16, lineHeight: 28 },
  cardDescGold: { textAlign: 'center', color: '#8B5A2B', opacity: 0.8, fontSize: 16, lineHeight: 28 },
  
  circleDownload: { 
    width: 55, height: 55, borderRadius: 30, borderWidth: 1, 
    borderColor: 'rgba(139, 90, 43, 0.2)', justifyContent: 'center', 
    alignItems: 'center', marginTop: 40 
  },
  goldActionPill: { 
    backgroundColor: '#8B5A2B', paddingHorizontal: 35, paddingVertical: 18, 
    borderRadius: 40, marginTop: 40, flexDirection: 'row', alignItems: 'center', gap: 10,
    elevation: 10, shadowColor: '#8B5A2B', shadowOpacity: 0.2, shadowRadius: 10,
    boxShadow: isWeb ? '0px 10px 20px rgba(139, 90, 43, 0.2)' : undefined,
  },
  goldPillText: { color: 'white', fontWeight: 'bold', fontSize: 11, letterSpacing: 2 },

  // FOOTER CORPORATIVO
  footer: { marginTop: 150, paddingBottom: 60, alignItems: 'center', opacity: 0.4 },
  footerBrand: { letterSpacing: 8, fontSize: 10, color: '#8B5A2B' }
});