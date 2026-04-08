import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, TextInput, Platform } from 'react-native';
import { auth, googleProvider } from '../../src/services/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [showEmail, setShowEmail] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const { setToken, setUserData, setDeviceId } = useUserStore();

  // Manejar resultado de redirect al montar (móvil)
  React.useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      setLoading(true);
      try {
        const user = result.user;
        const firebaseToken = await user.getIdToken();
        const res = await fetch(`${API_BASE}/auth/social-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: firebaseToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error('Error autenticando con backend');
        setToken(data.access_token);
        setDeviceId(data.user.uid);
        setUserData({ name: user.displayName, email: user.email, photo: user.photoURL });
      } catch (err) {
        setError('No pudimos iniciar sesión con Google. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    }).catch(() => {});
  }, []);

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const isMobile = Platform.OS !== 'web' || /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, provider);
        return; // página se recarga, resultado se captura en useEffect
      }
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const firebaseToken = await user.getIdToken();
      const res = await fetch(`${API_BASE}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: firebaseToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Error autenticando con backend');
      setToken(data.access_token);
      setDeviceId(data.user.uid);
      setUserData({ name: user.displayName, email: user.email, photo: user.photoURL });
    } catch (err) {
      console.error('Error al entrar:', err);
      setError('No pudimos iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Introduce tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const firebaseToken = await user.getIdToken();
      const res = await fetch(`${API_BASE}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: firebaseToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Error autenticando con backend');
      setToken(data.access_token);
      setDeviceId(data.user.uid);
      setUserData({ name: user.displayName || email, email: user.email, photo: user.photoURL });
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Correo o contraseña incorrectos.'
        : err.code === 'auth/user-not-found'
        ? 'No existe una cuenta con ese correo.'
        : err.code === 'auth/too-many-requests'
        ? 'Demasiados intentos. Espera un momento.'
        : 'No pudimos iniciar sesión. Comprueba tus datos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo-silueta.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Ágora Mujeres</Text>
        <Text style={styles.subtitle}>Tu refugio de calma y conexión</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#4A664D" size="large" />
      ) : (
        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.btnOutline} onPress={() => handleSocialLogin(googleProvider)}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.btnOutlineText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSolid} onPress={() => { setShowEmail(e => !e); setError(''); }}>
            <Ionicons name="mail-outline" size={20} color="white" />
            <Text style={styles.btnSolidText}>Iniciar sesión</Text>
          </TouchableOpacity>

          {showEmail && (
            <View style={styles.emailBox}>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#9A958E"
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Contrasena"
                placeholderTextColor="#9A958E"
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                secureTextEntry
              />
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#C0392B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <TouchableOpacity style={styles.submitBtn} onPress={handleEmailLogin}>
                <Text style={styles.submitBtnText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && !showEmail ? (
            <View style={[styles.errorBox, { marginTop: 12 }]}>
              <Ionicons name="alert-circle-outline" size={15} color="#C0392B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Todavía no tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Créala aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Text style={styles.footerText}>Al entrar, aceptas nuestras condiciones de seguridad.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7', alignItems: 'center', justifyContent: 'center', padding: 30 },
  logo: { width: 180, height: 180, marginBottom: 20 },
  textContainer: { alignItems: 'center', marginBottom: 50 },
  title: { fontSize: 32, fontWeight: '300', color: '#1A1A1A', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 14, color: '#4A664D', fontStyle: 'italic', marginTop: 5 },
  buttonWrapper: { width: '100%', maxWidth: 320 },
  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(74,102,77,0.3)', backgroundColor: 'white', marginBottom: 12 },
  btnOutlineText: { marginLeft: 12, color: '#1A1A1A', fontSize: 15, fontWeight: '500' },
  btnSolid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 50, backgroundColor: '#4A664D' },
  btnSolidText: { marginLeft: 12, color: 'white', fontSize: 15, fontWeight: '500' },
  emailBox: { backgroundColor: '#F0EDE4', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#E8E2D8' },
  input: { backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#3D3A35', borderWidth: 1, borderColor: '#E8E2D8' },
  submitBtn: { backgroundColor: '#4A664D', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF0EE', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#F5C6C2' },
  errorText: { color: '#C0392B', fontSize: 13, marginLeft: 6, flex: 1 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  registerText: { fontSize: 13, color: '#9A958E' },
  registerLink: { fontSize: 13, color: '#4A664D', fontWeight: '600', textDecorationLine: 'underline' },
  footerText: { position: 'absolute', bottom: 40, fontSize: 11, color: '#999', textAlign: 'center' },
});
