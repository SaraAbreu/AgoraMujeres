import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, TextInput, TouchableOpacity, View, 
  KeyboardAvoidingView, Platform, Alert, Dimensions, ScrollView,
  ActivityIndicator 
} from 'react-native';

// Wrapper que en web usa <form> (evita el warning "Password field not in a form")
// y en nativo usa View
const FormWrapper = Platform.OS === 'web'
  ? ({ children, onSubmit }: { children: React.ReactNode; onSubmit: () => void }) => (
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        style={{ display: 'contents' }}
      >
        {children}
      </form>
    )
  : ({ children }: { children: React.ReactNode; onSubmit: () => void }) => <>{children}</>;
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, 
  withSequence, FadeInDown, withSpring 
} from 'react-native-reanimated'; 
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';
import { useUserStore } from '../store/userStore';
import { signInWithGoogle, getGoogleRedirectResult } from '../services/firebaseConfig';

const { width } = Dimensions.get('window');

const EMAILS_AUTORIZADOS = [
  'syntexia.ai@gmail.com', 
  'saraabreu2c1997@gmail.com',
];

export default function LoginScreen() {
  const setUser  = useUserStore((state) => state.setUser);
  const setToken = useUserStore((state) => state.setToken);
  const router   = useRouter();
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const postAuthRoute = intent === 'aurea' ? '/plan' : '/(tabs)/home';

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]         = useState(false);

  const scale    = useSharedValue(1);
  const orbPress = useSharedValue(1);

  // Animación del orbe
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 2000 }), withTiming(1, { duration: 2000 })), 
      -1, true
    );
  }, []); 

  // Recoge el resultado del redirect de Google al volver a la página
  useEffect(() => {
    const checkRedirect = async () => {
      const pendingGoogle = Platform.OS === 'web' ? localStorage.getItem('pendingGoogleAuth') : null;
      try {
        const result = await getGoogleRedirectResult();
console.log("[REDIRECT RESULT]", result, "pending:", pendingGoogle);
        if (!result) {
          if (pendingGoogle) {
            // Vinimos de un redirect de Google pero no hay resultado → error visible
            localStorage.removeItem('pendingGoogleAuth');
            Alert.alert("Error de autenticación", "Google no devolvió credenciales. Intenta de nuevo o usa email/contraseña.");
          }
          return;
        }

        localStorage.removeItem('pendingGoogleAuth');
        setLoading(true);
        const response = await api.post('/auth/google', { token: result.token });

        if (response.data.status === 'success') {
          const { token: appToken, user: userBackend } = response.data;
          const emailUsuario = userBackend.email.toLowerCase();

          if (!EMAILS_AUTORIZADOS.includes(emailUsuario)) {
            Alert.alert("Acceso Restringido", "Este correo aún no ha sido invitado al santuario.");
            return;
          }

          await setToken(appToken);
          await setUser(userBackend);
          useUserStore.getState().setDevMode(emailUsuario === 'syntexia.ai@gmail.com');
          router.replace(postAuthRoute as any);
        } else {
          Alert.alert("Error", response.data.message ?? "No se pudo autenticar con Google.");
        }
      } catch (error: any) {
        console.error("[REDIRECT ERROR]", error?.code, error?.message, error?.response?.status);
        Alert.alert("Error de conexión", `Código: ${error?.code ?? error?.response?.status ?? 'desconocido'} — ${error?.message ?? ''}`);
      } finally {
        setLoading(false);
      }
    };

    checkRedirect();
  }, []);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * orbPress.value }],
  }));

  // Login con email y contraseña — lo que dispara el ORBE
  const handleAuth = async () => {
    if (!email || !password) {
      return Alert.alert("Campos incompletos", "Por favor, llena tus credenciales.");
    }
    setLoading(true);
    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const res = await api.post(endpoint, { email, password });
      if (res.data.token) {
        await setToken(res.data.token);
        if (res.data.user) await setUser(res.data.user);
        router.replace(postAuthRoute as any);
      }
    } catch (error) {
      Alert.alert("Error", "Credenciales incorrectas o problema de conexión.");
    } finally {
      setLoading(false);
    }
  };

  // Login con Google — usa popup (funciona en móvil con tap), con fallback a redirect
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();

      // Si token está vacío significa que se disparó el redirect (popup bloqueado)
      // El resultado se procesará en el useEffect checkRedirect cuando la página recargue
      if (!result.token) return;

      const response = await api.post('/auth/google', { token: result.token });

      if (response.data.status === 'success') {
        const { token: appToken, user: userBackend } = response.data;
        const emailUsuario = userBackend.email.toLowerCase();

        if (!EMAILS_AUTORIZADOS.includes(emailUsuario)) {
          Alert.alert("Acceso Restringido", "Este correo aún no ha sido invitado al santuario.");
          return;
        }

        await setToken(appToken);
        await setUser(userBackend);
        useUserStore.getState().setDevMode(emailUsuario === 'syntexia.ai@gmail.com');
        router.replace(postAuthRoute as any);
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') return;
      console.error("[GOOGLE LOGIN ERROR]", error);
      Alert.alert("Error", "No se pudo conectar con Google. Código: " + (error.code ?? 'desconocido'));
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

          <FormWrapper onSubmit={handleAuth}>
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
                  keyboardType="email-address"
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
          </FormWrapper>

          {/* ORBE — dispara login con EMAIL/CONTRASEÑA */}
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

          {/* BOTÓN GOOGLE — dispara redirect */}
          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={styles.line} /><Text style={styles.orText}>O</Text><View style={styles.line} />
            </View>
            <TouchableOpacity 
              style={styles.googleBtn} 
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={18} color="#8B5A2B" />
              <Text style={styles.googleBtnText}>CONTINUAR CON GOOGLE</Text>
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
  googleBtnText: { color: '#8B5A2B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  footer: { marginTop: 20 },
  footerText: { color: '#8B5A2B', opacity: 0.5 },
  signUpText: { color: '#C5A059', fontWeight: 'bold' },
});