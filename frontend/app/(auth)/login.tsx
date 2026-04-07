import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { auth, googleProvider } from '../../src/services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const { setToken, setUserData, setDeviceId } = useUserStore();

  const handleSocialLogin = async (provider: any) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const firebaseToken = await user.getIdToken();
      console.log("Firebase token:", firebaseToken);

      const res = await fetch(`${API_BASE}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: firebaseToken }),
      });

      const data = await res.json();
      console.log("BACKEND RESPONSE COMPLETO:", JSON.stringify(data, null, 2));

      if (!res.ok) {
        console.error("BACKEND LOGIN ERROR:", data);
        throw new Error("Error autenticando con backend");
      }

      setToken(data.access_token);
      setDeviceId(data.user.uid);
      setUserData({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      });

      console.log("LOGIN OK:", data);
      // redireccion manejada por _layout.tsx guard

    } catch (error) {
      console.error("Error al entrar:", error);
      Alert.alert("Error", "No pudimos iniciar sesión correctamente.");
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
          <TouchableOpacity
            style={styles.btn}
            onPress={() => handleSocialLogin(googleProvider)}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.btnText}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* Facebook */}
{/* FACEBOOK - pendiente configuración post-lanzamiento
          <TouchableOpacity 
            style={[styles.btn, { marginTop: 15 }]} 
            onPress={() => handleSocialLogin(facebookProvider)}
          >
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            <Text style={styles.btnText}>Continuar con Facebook</Text>
          </TouchableOpacity>
          */}

          {/* ✅ NUEVO — Crear cuenta con email */}
          <TouchableOpacity
            style={[styles.btn, { marginTop: 15, backgroundColor: '#4A664D', borderColor: '#4A664D' }]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Ionicons name="person-add-outline" size={20} color="white" />
            <Text style={[styles.btnText, { color: 'white' }]}>Crear cuenta con email</Text>
          </TouchableOpacity>

          {/* ✅ NUEVO — Volver al onboarding */}
          <TouchableOpacity
            style={{ marginTop: 20, alignItems: 'center' }}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.footerText}>
        Al entrar, aceptas nuestras condiciones de seguridad.
      </Text>
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
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(74, 102, 77, 0.3)', backgroundColor: 'white' },
  btnText: { marginLeft: 12, color: '#1A1A1A', fontSize: 15, fontWeight: '500' },
  footerText: { position: 'absolute', bottom: 40, fontSize: 11, color: '#999', textAlign: 'center' },
  linkText: { fontSize: 13, color: '#4A664D', textDecorationLine: 'underline' },
});