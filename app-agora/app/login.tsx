import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, TextInput, TouchableOpacity, View, 
  KeyboardAvoidingView, Platform, Alert, Dimensions, ScrollView,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, 
  withSequence, FadeInDown, withSpring 
} from 'react-native-reanimated'; 
import { useRouter } from 'expo-router';
import api from '../services/api';
import { useUserStore } from '../store/userStore';
import { signInWithGoogle } from '../services/firebaseConfig';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const setUser = useUserStore((state) => state.setUser);
  const setToken = useUserStore((state) => state.setToken);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const scale = useSharedValue(1);
  const orbPress = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 2000 }), withTiming(1, { duration: 2000 })), 
      -1, true
    );
  }, []); 

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * orbPress.value }],
  }));

  const handleGoogleLogin = async () => {
  // 1. Define aquí los correos que tienen permiso para entrar a la app
  const EMAILS_AUTORIZADOS = [
    'syntexia.ai@gmail.com', // Tú (Desarrollador)
    'saraabreu2c1997@gmail.com', // Alguien a quien quieras dejar entrar
  ];

  try {
    setLoading(true);
    const result = await signInWithGoogle();
    
    if (result.token) {
      const response = await api.post('/api/auth/google', { token: result.token });
      
      if (response.data.status === 'success') {
        const { token, user } = response.data;

        // 2. VALIDACIÓN DE ACCESO
        // Comprobamos si el email del usuario está en nuestra "lista blanca"
        const emailUsuario = user.email.toLowerCase();
        const estaAutorizado = EMAILS_AUTORIZADOS.includes(emailUsuario);

        if (!estaAutorizado) {
          // Si no está en la lista, no guardamos nada y lanzamos aviso
          Alert.alert(
            "Acceso Privado",
            "Lo sentimos, esta versión de Ágora es restringida. Tu correo no tiene permiso de acceso todavía.",
            [{ text: "Entendido" }]
          );
          return; // Detenemos la ejecución aquí, no llega al router.replace
        }

        // 3. SI ESTÁ AUTORIZADO, PROCEDEMOS
        await setToken(token);
        await setUser(user);

        // Activación automática del modo desarrollador (solo para ti)
        if (emailUsuario === 'syntexia.ai@gmail.com') {
          await useUserStore.getState().setDevMode(true);
        } else {
          await useUserStore.getState().setDevMode(false);
        }

        router.replace('/(tabs)/home');
      }
    }
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    Alert.alert("Error", "No se pudo conectar con el santuario.");
  } finally {
    setLoading(false);
  }
};

  const handleAuth = async () => {
    if (!email || !password) {
      return Alert.alert("Campos incompletos", "Por favor, llena tus credenciales.");
    }
    setLoading(true);
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const res = await api.post(endpoint, { email, password });
      if (res.data.token) await setToken(res.data.token);
      if (res.data.user) await setUser(res.data.user);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert("Error", "Credenciales incorrectas.");
    } finally {
      setLoading(false);
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
              disabled={loading}
            >
              <Animated.View style={[styles.loginOrbe, animatedOrbStyle]}>
                {loading ? (
                  <ActivityIndicator color="#C5A059" />
                ) : (
                  <Ionicons name={isRegistering ? 'person-add-outline' : 'finger-print-outline'} size={38} color="#C5A059" />
                )}
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.portalText}>{isRegistering ? 'Registrar' : 'Entrar'}</Text>
          </View>

          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
               <View style={styles.line} /><Text style={styles.orText}>O</Text><View style={styles.line} />
            </View>
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
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