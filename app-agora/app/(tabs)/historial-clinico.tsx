import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, AccessibilityRole
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/userStore';

const { width }   = Dimensions.get('window');
const colorText   = '#5C3A1E';
const colorAccent = '#C5A059';
const colorSoft   = '#8B5A2B';
const colorMuted  = 'rgba(92,58,30,0.4)';

export default function HistorialClinicoScreen() {
  const router   = useRouter();
  const historial = useUserStore((s) => s.historial ?? []);
  const [pressed, setPressed] = useState(false);

  return (
    <View style={s.container}>
      <LinearGradient colors={['#FBF8F4', '#F2EBE0', '#E8D9C4']} style={StyleSheet.absoluteFill} />

      {/* TOPBAR */}
      <View style={s.topbar}>
        <TouchableOpacity
          style={[s.backBtn, pressed && s.backBtnPressed]}
          onPress={() => router.replace('/(tabs)/home')}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          accessibilityRole={"button" as AccessibilityRole}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colorSoft} />
          <Text style={s.backText}>INICIO</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
          <View style={s.headerIconCircle}>
            <Ionicons name="medkit-outline" size={26} color={colorAccent} />
          </View>
          <View>
            <Text style={s.sectionLabel}>TU SALUD</Text>
            <Text style={s.title}>Historial Clínico</Text>
          </View>
        </Animated.View>

        {/* LISTA */}
        {historial.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(150)} style={s.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={colorAccent} style={{ opacity: 0.4, marginBottom: 14 }} />
            <Text style={s.emptyTitle}>Sin registros aún</Text>
            <Text style={s.emptyDesc}>Cuando guardes glucosa u otros datos médicos, aparecerán aquí de forma segura y privada.</Text>
          </Animated.View>
        ) : (
          historial.map((entry: any, index: number) => (
            <Animated.View key={index} entering={FadeInDown.delay(100 + index * 60)} style={s.entryCard}>
              <View style={[s.entryIcon, { backgroundColor: colorAccent + '1A' }]}>
                <MaterialCommunityIcons
                  name={entry.tipo === 'glucosa' ? 'water-outline' : 'heart-pulse'}
                  size={20} color={colorAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.entryTipo}>{entry.tipo.toUpperCase()}</Text>
                <Text style={s.entryFecha}>{new Date(entry.fecha).toLocaleString()}</Text>
              </View>
              <View style={s.entryValueBox}>
                <Text style={s.entryValue}>{entry.valor}</Text>
                <Text style={s.entryUnit}>{entry.unidad}</Text>
              </View>
            </Animated.View>
          ))
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },

  topbar: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 12 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(139,90,43,0.1)',
    alignSelf: 'flex-start',
  },
  backBtnPressed: { backgroundColor: '#F5F0E8', borderColor: colorAccent },
  backText: { fontSize: 10, color: colorSoft, fontWeight: '700', letterSpacing: 2 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 24, marginTop: 8,
  },
  headerIconCircle: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: colorAccent + '1A',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: { fontSize: 8.5, color: colorMuted, letterSpacing: 4, fontWeight: '500', textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '200', color: colorSoft, letterSpacing: 3, textTransform: 'uppercase' },

  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 32, padding: 36,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: colorSoft, shadowOpacity: 0.05,
    shadowRadius: 15, elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: '300', color: colorSoft, letterSpacing: 2, marginBottom: 10 },
  emptyDesc: { fontSize: 12, color: colorMuted, textAlign: 'center', lineHeight: 19, maxWidth: 260 },

  entryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 24, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: colorSoft, shadowOpacity: 0.04,
    shadowRadius: 12, elevation: 2,
  },
  entryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  entryTipo: { fontSize: 10, fontWeight: '700', color: colorSoft, letterSpacing: 2 },
  entryFecha: { fontSize: 11, color: colorMuted, marginTop: 3 },
  entryValueBox: { alignItems: 'flex-end' },
  entryValue: { fontSize: 24, fontWeight: '200', color: colorSoft, letterSpacing: -1 },
  entryUnit: { fontSize: 8, color: colorMuted, fontWeight: '700', letterSpacing: 2 },
});