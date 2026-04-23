import React, { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, AccessibilityRole } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/userStore';

const { width } = Dimensions.get('window');
const colorText = '#8B5A2B';
const colorAccent = '#C5A059';

export default function IdentificacionBiometriaScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [biometriaDisponible, setBiometriaDisponible] = useState(false);
  const [biometriaActiva, setBiometriaActiva] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometriaDisponible(Platform.OS !== 'web' && compatible && enrolled);
      const stored = await AsyncStorage.getItem('biometriaActiva');
      setBiometriaActiva(stored === 'true');
      setChecking(false);
    })();
  }, []);

  const handleToggleBiometria = async () => {
    if (!biometriaActiva) {
      // Activar: pedir autenticación biométrica
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirma tu identidad para activar la biometría' });
      if (result.success) {
        setBiometriaActiva(true);
        await AsyncStorage.setItem('biometriaActiva', 'true');
      }
    } else {
      setBiometriaActiva(false);
      await AsyncStorage.setItem('biometriaActiva', 'false');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInDown.duration(600)} style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-circle-outline" size={84} color={colorAccent} accessibilityLabel="Avatar de usuario" />
          </View>
        </View>
        <Text style={styles.title}>Identidad Digital</Text>
        <Text style={styles.sectionLabel}>Datos personales</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color={colorText} />
          <Text style={styles.infoText}>{user?.name || 'Nombre no disponible'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color={colorText} />
          <Text style={styles.infoText}>{user?.email || 'Email no disponible'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name={user?.plan ? 'star' : 'star-outline'} size={20} color={user?.plan ? '#C5A059' : colorText} />
          <Text style={[styles.infoText, user?.plan && styles.infoTextPlan]}>{user?.plan ? `Plan ${user.plan}` : 'Sin plan activo'}</Text>
        </View>
        {user?.createdAt && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={colorText} />
            <Text style={styles.infoText}>Alta: {new Date(user.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
        <View style={styles.separator} />
        <Text style={styles.sectionLabel}>Biometría</Text>
        <Text style={styles.biometricsDesc}>
          La biometría te permite acceder a la app usando tu huella dactilar o reconocimiento facial, según tu dispositivo. Es una forma rápida y segura de proteger tu cuenta: solo tú puedes desbloquearla con tus datos físicos. Puedes activar o desactivar esta opción cuando quieras.
        </Text>
        {checking ? (
          <Text style={styles.biometricsText}>Comprobando disponibilidad...</Text>
        ) : biometriaDisponible ? (
          <View style={[styles.biometricsRow, { justifyContent: 'space-between', width: '100%' }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons
                name={biometriaActiva ? 'finger-print' : 'finger-print-outline'}
                size={28}
                color={biometriaActiva ? '#4CAF50' : colorAccent}
                accessibilityLabel={biometriaActiva ? 'Biometría activada' : 'Biometría no activada'}
              />
              <Text style={[styles.biometricsText, biometriaActiva && styles.biometricsTextActive]}>{biometriaActiva ? 'Activada' : 'No activada'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.switchBtn, biometriaActiva && styles.switchBtnActive]}
              onPress={handleToggleBiometria}
              accessibilityLabel={biometriaActiva ? 'Desactivar biometría' : 'Activar biometría'}
              accessibilityRole="switch"
              activeOpacity={0.7}
            >
              <View style={[styles.switchKnob, biometriaActiva && styles.switchKnobActive]} />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.biometricsText}>No disponible en esta plataforma</Text>
        )}
          {/* ...existing code... */}
      </Animated.View>
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
  avatarContainer: { marginBottom: 10 },
  avatarCircle: {
    backgroundColor: '#F5F0E8',
    borderRadius: 60,
    padding: 6,
    shadowColor: colorAccent,
    shadowOpacity: 0.10,
    shadowRadius: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colorText,
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    color: colorAccent,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 2,
    alignSelf: 'flex-start',
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  infoText: {
    fontSize: 16,
    color: colorText,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  infoTextPlan: {
    color: colorAccent,
    fontWeight: 'bold',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6D5B8',
    marginVertical: 14,
    opacity: 0.4,
    borderRadius: 1,
  },
  biometricsDesc: {
    fontSize: 13,
    color: '#BBAA8A',
    marginBottom: 8,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  biometricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  biometricsText: {
    fontSize: 15,
    color: colorText,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  biometricsTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
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