import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, TextInput, TouchableOpacity, View, 
  KeyboardAvoidingView, Platform, Alert, Dimensions, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, 
  withSequence, FadeInDown, withSpring 
} from 'react-native-reanimated'; 
import { useRouter } from 'expo-router';
// IMPORTS DE AUTENTICACIÓN
import api, { saveToken } from '../services/api';
import { signInWithGoogle } from '../services/firebaseConfig';
const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);


  // --- LOGIN CON GOOGLE/FIREBASE ---
  const handleGoogleLogin = async () => {
    try {
      const { token, user } = await signInWithGoogle();
      if (token) {
        const res = await api.post('/api/auth/google', { token });
        if (res.data.status === "success") {
          if (res.data.token) await saveToken(res.data.token);
          // Espera breve para asegurar que el layout esté montado
          setTimeout(() => {
            router.replace({
              pathname: '/home',
              params: {
                userName: res.data.user.name || "Usuaria Ágora",
                userEmail: res.data.user.email
              }
            });
          }, 150);
        } else {
          Alert.alert('Error', res.data.error || 'No se pudo iniciar sesión');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar sesión con Google');
    }
  };

  // --- ANIMACIONES ---
  const scale = useSharedValue(1);
  const orbPress = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 2000 }), withTiming(1, { duration: 2000 })), 
      -1, true
    );
  }, [scale]); 

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * orbPress.value }],
  }));

  const handleAuth = async () => {
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const res = await api.post(endpoint, { email, password });
      if (res.data.token) {
        await saveToken(res.data.token);
        router.replace('/home');
      }
    } catch (error) {
      Alert.alert("Error", "Acceso denegado. Revisa tus credenciales.");
    }
  };

  return (
    <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <Text style={styles.logo}>ÁGORA</Text>
            <View style={styles.manifestoLine} />
            <Text style={styles.subLogo}>{isRegistering ? 'CREAR IDENTIDAD' : 'EL SANTUARIO DIGITAL'}</Text>
          </Animated.View>

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
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#C5A059" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.portalContainer}>
            <TouchableOpacity 
              onPress={handleAuth} 
              onPressIn={() => { orbPress.value = withSpring(0.9) }}
              onPressOut={() => { orbPress.value = withSpring(1) }}
              activeOpacity={1}
            >
              <Animated.View style={[styles.loginOrbe, animatedOrbStyle]}>
                <Ionicons name={isRegistering ? 'person-add-outline' : 'finger-print-outline'} size={38} color="#C5A059" />
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.portalText}>{isRegistering ? 'Registrar' : 'Entrar'}</Text>
          </View>

          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
               <View style={styles.line} /><Text style={styles.orText}>O</Text><View style={styles.line} />
            </View>
            <TouchableOpacity 
              style={styles.googleBtn} 
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={18} color="#8B5A2B" />
              <Text style={styles.googleBtnText}>GOOGLE</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.footer} onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.footerText}>
              {isRegistering ? '¿Ya tienes cuenta? ' : '¿Primera vez aquí? '}
              <Text style={styles.signUpText}>{isRegistering ? 'ENTRAR' : 'UNIRSE'}</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  scrollContent: { paddingHorizontal: width > 600 ? 100 : 40, paddingVertical: 60, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 42, fontWeight: '100', color: '#C5A059', letterSpacing: 15 },
  manifestoLine: { width: 30, height: 1, backgroundColor: '#C5A059', marginVertical: 15, opacity: 0.4 },
  subLogo: { fontSize: 10, color: '#8B5A2B', letterSpacing: 4, opacity: 0.6 },
  formContainer: { width: '100%', marginBottom: 30 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 25, marginBottom: 16, paddingHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  icon: { marginRight: 15, opacity: 0.5 },
  input: { flex: 1, paddingVertical: 18, color: '#8B5A2B' },
  portalContainer: { alignItems: 'center', marginBottom: 40 },
  loginOrbe: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center', elevation: 8,
    shadowColor: '#8B5A2B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,
  },
  portalText: { marginTop: 10, fontSize: 10, color: '#8B5A2B', letterSpacing: 2 },
  socialSection: { width: '100%', alignItems: 'center', marginBottom: 30 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '60%', marginBottom: 15 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(139, 90, 43, 0.1)' },
  orText: { marginHorizontal: 10, fontSize: 8, color: '#8B5A2B', opacity: 0.4 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 35, paddingVertical: 14, borderRadius: 35, gap: 12,
    borderWidth: 1, borderColor: 'rgba(139, 90, 43, 0.1)',
  },
  googleBtnText: { color: '#8B5A2B', fontSize: 10, fontWeight: 'bold' },
  footer: { marginTop: 20 },
  footerText: { color: '#8B5A2B', opacity: 0.5 },
  signUpText: { color: '#C5A059', fontWeight: 'bold' },
});