import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard, PremiumButton } from '../src/components/ui';
// 1. IMPORTACIÓN CORREGIDA (Usamos useUserStore)
import { useUserStore } from '../src/store/useStore';
import { colors, textStyles, sp, radius } from '../src/theme';

const CRISIS_PHONE = '024'; 

export default function CrisisScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 2. EXTRAEMOS LOS DATOS DEL STORE CORRECTO
  const { deviceId, userToken } = useUserStore();

  const handleCall = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Linking.openURL(`tel:${CRISIS_PHONE}`);
  };

  const handleCrisisMsg = async () => {
    // Aquí podrías añadir lógica para avisar al backend de una crisis
    console.log("Iniciando modo crisis para:", deviceId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>S.O.S Calma</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <LinearGradient
          colors={['#FEF2F2', '#FFF5F5', '#FDFBF7']}
          style={styles.hero}
        >
          <View style={styles.heartCircle}>
            <Ionicons name="heart" size={32} color="#EF4444" />
          </View>
          <Text style={styles.heroTitle}>Estamos contigo</Text>
          <Text style={styles.heroSub}>Tómate un momento para respirar. No estás sola.</Text>
        </LinearGradient>

        {/* Llamar */}
        <GlassCard style={styles.callCard}>
          <View style={styles.callIconBg}>
             <Ionicons name="call" size={24} color="#EF4444" />
          </View>
          <View style={styles.callInfo}>
            <Text style={styles.callTitle}>Ayuda profesional 24h</Text>
            <Text style={styles.callNumber}>{CRISIS_PHONE}</Text>
            <Text style={styles.callDesc}>Línea gratuita y anónima</Text>
          </View>
          <TouchableOpacity onPress={handleCall} style={styles.callBtn}>
             <Text style={styles.callBtnText}>Llamar</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Respiración */}
        <Text style={styles.sectionTitle}>Respiración 4-4-6</Text>
        <GlassCard style={styles.breathCard}>
          <Text style={styles.breathStep}>1. Inhala suavemente — 4s</Text>
          <Text style={styles.breathStep}>2. Mantén el aire — 4s</Text>
          <Text style={styles.breathStep}>3. Exhala despacio — 6s</Text>
          <Text style={styles.breathNote}>Repite este ciclo hasta sentir que tu pulso baja.</Text>
        </GlassCard>

        {/* Grounding 5-4-3-2-1 */}
        <Text style={styles.sectionTitle}>Técnica de anclaje</Text>
        <GlassCard>
          {[
            { n: 5, sense: "Cosas que puedes ver", icon: 'eye-outline' },
            { n: 4, sense: "Cosas que puedes tocar", icon: 'hand-left-outline' },
            { n: 3, sense: "Sonidos que escuchas", icon: 'ear-outline' },
            { n: 2, sense: "Olores que percibes", icon: 'flower-outline' },
            { n: 1, sense: "Sabor en tu boca", icon: 'restaurant-outline' },
          ].map((item, i) => (
            <View key={i} style={styles.groundRow}>
              <View style={styles.groundCircle}>
                <Text style={styles.groundN}>{item.n}</Text>
              </View>
              <Ionicons name={item.icon as any} size={18} color={colors.primary} />
              <Text style={styles.groundText}>{item.sense}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Hablar con Ágora */}
        <View style={styles.agoraSection}>
          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={() => { handleCrisisMsg(); router.replace('/(tabs)/chat'); }}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={styles.chatBtnText}>Necesito hablar con Ágora</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
            Esta herramienta es un apoyo, no sustituye a un profesional sanitario o de emergencias.
        </Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2D3E2D', flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: {
    borderRadius: 30, padding: 30,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#FEE2E2'
  },
  heartCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 15,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#2D3E2D', textAlign: 'center' },
  heroSub:   { fontSize: 14, color: '#9EAA9E', textAlign: 'center', marginTop: 8 },

  callCard: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20, padding: 15 },
  callIconBg: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  callInfo: { flex: 1 },
  callTitle:  { fontSize: 14, fontWeight: '600', color: '#2D3E2D' },
  callNumber: { fontSize: 20, fontWeight: '800', color: '#EF4444', marginVertical: 2 },
  callDesc:   { fontSize: 12, color: '#9EAA9E' },
  callBtn: { backgroundColor: '#EF4444', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  callBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#9EAA9E',
    marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1
  },

  breathCard: { gap: 10, padding: 20 },
  breathStep: { fontSize: 15, color: '#2D3E2D', fontWeight: '500' },
  breathNote: { fontSize: 13, color: '#9EAA9E', marginTop: 5, fontStyle: 'italic' },

  groundRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  groundCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#EAF4E8',
    alignItems: 'center', justifyContent: 'center',
  },
  groundN:     { fontSize: 12, color: '#4A664D', fontWeight: 'bold' },
  groundText: { fontSize: 14, color: '#2D3E2D', flex: 1 },

  agoraSection: { marginTop: 25 },
  chatBtn: { 
    backgroundColor: '#4A664D', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 20,
    gap: 10
  },
  chatBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  disclaimer: {
    fontSize: 11, color: '#9EAA9E',
    textAlign: 'center', marginTop: 20,
    lineHeight: 16,
  },
});