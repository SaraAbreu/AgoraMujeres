import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated'; 
import { useRouter } from 'expo-router'; // IMPORTANTE
import api, { saveToken } from '../services/api';

export default function LoginScreen() {
  const router = useRouter(); // Hook para navegar
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Animación del Orbe (Heartbeat)
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.05, { duration: 1500 }), withTiming(1, { duration: 1500 })), -1, true);
  }, []);
  const animatedHeartbeat = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Ágora', 'Por favor, completa los campos.');
      return;
    }

    try {
      if (isRegistering) {
        await api.post('/auth/register', { email, password });
        Alert.alert('¡Éxito!', 'Cuenta creada. Ahora inicia sesión.');
        setIsRegistering(false);
      } else {
        console.log('Iniciando desafío de identidad...');
        const response = await api.post('/auth/login', { email, password });

          if (response.data.token) {
              await saveToken(response.data.token);
              console.log('Token guardado. Navegando...');

              // Usamos un pequeño delay para dejar que el storage se asiente
              setTimeout(() => {
                  router.replace('/onboarding');
              }, 100);
          }
      }
    } catch (error: any) {
      console.error('Fallo en el portal:', error);
      Alert.alert('Error de Acceso', 'Las sombras no reconocen tus credenciales.');
    }
  };

  return (
    <LinearGradient colors={['#FDFCFB', '#F5F0E8']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>

        <View style={styles.header}>
          <Text style={styles.logo}>ÁGORA</Text>
          <Text style={styles.subLogo}>{isRegistering ? 'CREAR NUEVA CUENTA' : 'BIENESTAR ORGÁNICO'}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#8B5A2B" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="rgba(139, 90, 43, 0.3)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#8B5A2B" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="rgba(139, 90, 43, 0.3)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <View style={styles.portalContainer}>
          <TouchableOpacity onPress={handleAuth} activeOpacity={0.8}>
            <Animated.View style={[styles.loginOrbe, animatedHeartbeat]}>
              <Ionicons
                name={isRegistering ? 'person-add-outline' : 'finger-print-outline'}
                size={32}
                color="#C5A059"
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.portalText}>
            {isRegistering ? 'Toca para registrarte' : 'Toca para entrar'}
          </Text>
        </View>

        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>O CONTINÚA CON</Text>
            <View style={styles.line} />
          </View>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}><Ionicons name="logo-google" size={24} color="#DB4437" /></TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}><Ionicons name="logo-apple" size={24} color="#000" /></TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}><Ionicons name="logo-facebook" size={24} color="#1877F2" /></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => setIsRegistering(!isRegistering)}>
          <Text style={styles.footerText}>
            {isRegistering ? '¿Ya tienes cuenta? ' : '¿Todavía no eres parte? '}
            <Text style={styles.signUpText}>{isRegistering ? 'INICIA SESIÓN' : 'CREA TU PERFIL'}</Text>
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 40, justifyContent: 'space-around', paddingVertical: 50 },
  header: { alignItems: 'center' },
  logo: { fontSize: 48, fontWeight: '200', color: '#C5A059', letterSpacing: 12 },
  subLogo: { fontSize: 10, color: '#8B5A2B', letterSpacing: 5, opacity: 0.5, marginTop: 10 },
  formContainer: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 20, marginBottom: 16, paddingHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(197, 160, 89, 0.1)',
  },
  icon: { marginRight: 12, opacity: 0.6 },
  input: { flex: 1, paddingVertical: 18, color: '#8B5A2B', fontSize: 15 },
  portalContainer: { justifyContent: 'center', alignItems: 'center' },
  loginOrbe: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#8B5A2B', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 15, elevation: 10,
    borderWidth: 1, borderColor: 'rgba(197, 160, 89, 0.2)',
  },
  portalText: { marginTop: 15, color: '#8B5A2B', fontSize: 10, letterSpacing: 2, opacity: 0.6, textTransform: 'uppercase' },
  socialSection: { width: '100%', alignItems: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(139, 90, 43, 0.1)' },
  orText: { marginHorizontal: 15, fontSize: 9, color: '#8B5A2B', opacity: 0.5, letterSpacing: 2 },
  socialRow: { flexDirection: 'row', gap: 20 },
  socialBtn: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  footer: { alignItems: 'center' },
  footerText: { color: '#8B5A2B', opacity: 0.6, fontSize: 13 },
  signUpText: { color: '#C5A059', fontWeight: 'bold' },
});