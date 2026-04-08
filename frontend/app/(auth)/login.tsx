import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { auth, googleProvider } from '../../src/services/firebase';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
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
  const { setToken, setUserData, setDeviceId } = useUserStore();

  const handleSocialLogin = async (provider: any) => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error al entrar:', error);
      Alert.alert('Error', 'No pudimos iniciar sesión correctamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Introduce tu correo y contraseña.');
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
    } catch (error: any) {
      const msg = error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password'
        ? 'Correo o contraseña incorrectos.'
        : error.code === 'auth/user-not-found'
        ? 'No existe una cuenta con ese correo.'
        : 'No pudimos iniciar sesión. Comprueba tus datos.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo-silueta.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Ágora Mujeres</Text>
        <Text style={styles.subtitle}>Tu refugio de calma y conexión</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#4A664D" size="large" />
      ) : (
        <View style={styles.buttonWrapper}>

          {/* Google */}
          <TouchableOpacity style={styles.btnOutline} onPress={() => handleSocialLogin(googleProvider)}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.btnOutlineText}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* Email login */}
          <TouchableOpacity
            style={styles.btnSolid}
            onPress={() => setShowEmail(e => !e)}
          >
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
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Contraseña"
                placeholderTextColor="#9A958E"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.submitBtn} onPress={handleEmailLogin}>
                <Text style={styles.submitBtnText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Crear cuenta */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>¿Todavía no tienes cuenta? </Text>
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
  title: { fontSize: 32, fontWeight: '300', color: '#1A1A1A', letterSpacing: 3 },
  subtitle: { fontSize: 14, color: '#4A664D', fontStyle: 'italic', marginTop: 5 },
  buttonWrapper: { width: '100%', maxWidth: 320 },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 50, borderWidth: 1,
    borderColor: 'rgba(74,102,77,0.3)', backgroundColor: 'white', marginBottom: 12,
  },
  btnOutlineText: { marginLeft: 12, color: '#1A1A1A', fontSize: 15, fontWeight: '500' },
  btnSolid: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 50, backgroundColor: '#4A664D',
  },
  btnSolidText: { marginLeft: 12, color: 'white', fontSize: 15, fontWeight: '500' },
  emailBox: { backgroundColor: '#F0EDE4', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#E8E2D8' },
  input: { backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#3D3A35', borderWidth: 1, borderColor: '#E8E2D8' },
  submitBtn: { backgroundColor: '#4A664D', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  registerText: { fontSize: 13, color: '#9A958E' },
  registerLink: { fontSize: 13, color: '#4A664D', fontWeight: '600', textDecorationLine: 'underline' },
  footerText: { position: 'absolute', bottom: 40, fontSize: 11, color: '#999', textAlign: 'center' },
});
