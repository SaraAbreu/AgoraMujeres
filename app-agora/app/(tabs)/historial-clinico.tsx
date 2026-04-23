
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, AccessibilityRole } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const colorText = '#8B5A2B';
const colorAccent = '#C5A059';
export default function HistorialClinicoScreen() {
  const router = useRouter();
  // Aquí podrías cargar el historial real desde la API o el store
  const historial = [];
  const [pressed, setPressed] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInDown.duration(600)} style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="medkit-outline" size={38} color={colorAccent} accessibilityLabel="Icono historial clínico" />
          </View>
          <Text style={styles.title}>Historial Clínico</Text>
        </View>
        {historial.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color={colorAccent} style={{ marginBottom: 12 }} accessibilityLabel="Sin registros" />
            <Text style={styles.emptyText}>No tienes registros clínicos guardados.</Text>
            <Text style={styles.emptySubText}>Cuando añadas información médica, aparecerá aquí de forma segura y privada.</Text>
          </View>
        ) : (
          <>
            {/* Aquí puedes mapear los registros reales */}
            <View><Text>Registros clínicos...</Text></View>
          </>
        )}
        <TouchableOpacity
          style={[styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => router.replace('/ajustes')}
          accessibilityLabel="Volver a ajustes"
          accessibilityRole={"button" as AccessibilityRole}
          activeOpacity={0.7}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
        >
          <Ionicons name="arrow-back" size={22} color={colorText} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: width > 500 ? 420 : width * 0.92,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 30,
    padding: 32,
    alignItems: 'center',
    shadowColor: colorAccent,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
    justifyContent: 'center',
  },
  headerIconCircle: {
    backgroundColor: '#F5F0E8',
    borderRadius: 32,
    padding: 6,
    shadowColor: colorAccent,
    shadowOpacity: 0.10,
    shadowRadius: 8,
    marginRight: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colorText,
    letterSpacing: 1,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(245,240,232,0.45)',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    shadowColor: colorAccent,
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 16,
    color: colorText,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#BBAA8A',
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.13)',
    shadowColor: colorAccent,
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  backBtnPressed: {
    backgroundColor: '#F5F0E8',
    borderColor: colorAccent,
    shadowOpacity: 0.18,
  },
  backText: { color: colorText, fontSize: 15, fontWeight: 'bold', marginLeft: 2 },
});