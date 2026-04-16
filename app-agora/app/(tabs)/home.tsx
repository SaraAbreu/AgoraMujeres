import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ScrollView, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const colorText = '#8B5A2B';
const colorAccent = '#C5A059';

export default function HomeSantuario() {
  const router = useRouter();
  
  // LOGICA DE TIEMPO (90 min = 5400 seg)
  const [secondsLeft, setSecondsLeft] = useState(5400);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsBlocked(true);
          return 0;
        }
        // Aviso 10 minutos
        if (prev === 600) {
          Alert.alert("Santuario Ágora", "Te quedan 10 minutos de paz. Aprovecha este último tramo.");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Convertir a formato MM
  const displayMinutes = Math.floor(secondsLeft / 60);

  // Animación Orbe
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 3000 }), withTiming(1, { duration: 3000 })), -1, true);
  }, []);
  const animatedOrb = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  // Pantalla de Bloqueo (Muro de pago)
  if (isBlocked) {
    return (
      <View style={styles.blockedContainer}>
        <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
        <Ionicons name="lock-closed-outline" size={80} color={colorText} style={{ opacity: 0.2, marginBottom: 20 }} />
        <Text style={styles.timeBig}>0</Text>
        <Text style={styles.blockedTitle}>TIEMPO AGOTADO</Text>
        <Text style={styles.blockedDesc}>Has completado tu sesión de paz diaria. Suscríbete al Plan Áurea para acceso ilimitado.</Text>
        <TouchableOpacity style={styles.premiumBtn} onPress={() => router.push('/ajustes')}>
          <Text style={styles.premiumBtnText}>VER PLANES PREMIUM</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <Image source={require('../../assets/images/logo2.png')} style={styles.bgLogo} resizeMode="contain" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandSubtitle}>MI BITÁCORA</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeBig}>{displayMinutes}</Text>
              <View style={styles.timeLabelContainer}>
                <Text style={styles.timeLabel}>minutos</Text>
                <Text style={styles.timeSubLabel}>de paz</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.pdfBtn} activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={16} color={colorText} />
            <Text style={styles.pdfText}>INFORME MÉDICO</Text>
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.quoteCard}>
          <Text style={styles.quoteText}>"Escucha tu cuerpo; cada registro es un paso hacia tu bienestar."</Text>
        </Animated.View>

        <View style={styles.actionSection}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/chat')} style={styles.orbShadow}>
            <Animated.View style={[styles.mainOrb, animatedOrb]}>
              <LinearGradient colors={[colorText, colorAccent]} style={StyleSheet.absoluteFill} start={{x:0, y:0}} end={{x:1, y:1}} />
              <Ionicons name="mic-outline" size={35} color="white" />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.orbLabel}>HABLAR CON ÁGORA</Text>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.healthCard} activeOpacity={0.8}>
            <MaterialCommunityIcons name="water-percent" size={22} color={colorAccent} />
            <Text style={styles.cardValue}>0</Text>
            <View style={styles.cardActionRow}>
                <Text style={styles.cardTitle}>GLUCOSA</Text>
                <Ionicons name="add-circle-outline" size={14} color={colorAccent} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.healthCard} activeOpacity={0.8}>
            <MaterialCommunityIcons name="flower-outline" size={22} color={colorText} />
            <Text style={styles.cardValue}>0</Text>
            <View style={styles.cardActionRow}>
                <Text style={styles.cardTitle}>CICLO</Text>
                <Ionicons name="calendar-outline" size={14} color={colorText} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.symptomsCard}>
          <View style={styles.symptomsHeader}>
            <Ionicons name="pulse-outline" size={18} color={colorText} />
            <Text style={styles.symptomsTitle}>SÍNTOMAS PARA EL MÉDICO</Text>
          </View>
          <View style={styles.tagRow}>
            <TouchableOpacity style={styles.addTag}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.tagText}>No hay registros hoy</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.diaryBtn} onPress={() => router.push('/diario')}>
          <LinearGradient colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']} style={[StyleSheet.absoluteFill, { borderRadius: 30 }]} />
          <View style={styles.diaryContent}>
            <Ionicons name="book-outline" size={20} color={colorText} />
            <Text style={styles.diaryBtnText}>ESCRIBIR EN MI DIARIO PERSONAL</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgLogo: { position: 'absolute', width: width * 1.5, height: width * 1.5, alignSelf: 'center', top: height * 0.1, opacity: 0.03 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  brandSubtitle: { fontSize: 10, letterSpacing: 2, color: colorText, opacity: 0.6, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: -5 },
  timeBig: { fontSize: 110, fontWeight: '100', color: colorText, letterSpacing: -5 },
  timeLabelContainer: { marginTop: -15 },
  timeLabel: { fontSize: 16, color: colorText, fontStyle: 'italic', opacity: 0.8 },
  timeSubLabel: { fontSize: 10, color: colorText, opacity: 0.5, letterSpacing: 1 },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 15, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1, borderColor: 'rgba(139, 90, 43, 0.1)' },
  pdfText: { fontSize: 9, fontWeight: 'bold', color: colorText, letterSpacing: 1 },
  quoteCard: { backgroundColor: 'rgba(255, 255, 255, 0.3)', padding: 22, borderRadius: 30, marginBottom: 40, borderLeftWidth: 3, borderLeftColor: colorAccent },
  quoteText: { fontSize: 14, color: colorText, fontStyle: 'italic', lineHeight: 22, fontWeight: '300' },
  actionSection: { alignItems: 'center', marginBottom: 50 },
  orbShadow: { shadowColor: colorAccent, shadowOpacity: 0.25, shadowRadius: 25, elevation: 15, borderRadius: 60 },
  mainOrb: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  orbLabel: { marginTop: 18, fontSize: 10, letterSpacing: 4, color: colorText, fontWeight: 'bold', opacity: 0.7 },
  grid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  healthCard: { flex: 1, padding: 22, backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 35, borderWidth: 1, borderColor: 'white', alignItems: 'center' },
  cardValue: { fontSize: 28, color: colorText, fontWeight: '300', marginVertical: 5 },
  cardActionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 9, fontWeight: 'bold', color: colorAccent, letterSpacing: 1 },
  symptomsCard: { backgroundColor: 'white', padding: 25, borderRadius: 40, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  symptomsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  symptomsTitle: { fontSize: 10, fontWeight: 'bold', color: colorText, letterSpacing: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagText: { fontSize: 12, color: colorText, opacity: 0.4 },
  addTag: { backgroundColor: colorAccent, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  diaryBtn: { marginTop: 20, borderRadius: 30, borderWidth: 1, borderColor: 'white', position: 'relative', overflow: 'hidden' },
  diaryContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22 },
  diaryBtnText: { fontSize: 11, fontWeight: 'bold', color: colorText, letterSpacing: 1 },
  
  // ESTILOS BLOQUEO
  blockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  blockedTitle: { fontSize: 22, fontWeight: 'bold', color: colorText, letterSpacing: 2, marginBottom: 10 },
  blockedDesc: { textAlign: 'center', color: colorText, opacity: 0.6, lineHeight: 20, marginBottom: 30 },
  premiumBtn: { backgroundColor: colorText, paddingVertical: 18, paddingHorizontal: 30, borderRadius: 20 },
  premiumBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 }
});