import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '../../src/services/api';
import { useStore } from '../../src/store/useStore';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initializeDevice = useStore((state) => state.initializeDevice) || (async () => '');

  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Por favor rellena el correo y la contraseña.');
      return;
    }

    setLoading(true);
    try {
      const deviceId = await initializeDevice();
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';

      const body: Record<string, string> = { email, password, device_id: deviceId };
      if (mode === 'register' && name.trim()) body.name = name;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.replace('/(tabs)');
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert(
          mode === 'login' ? 'No pudimos entrar' : 'No pudimos crear la cuenta',
          data?.detail ?? 'Inténtalo de nuevo.'
        );
      }
    } catch {
      Alert.alert('Error de conexión', 'Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>

        {/* CABECERA */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'login' ? 'Bienvenida' : 'Crear cuenta'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Tu espacio te está esperando'
              : 'Empieza tu camino con Ágora'}
          </Text>
        </View>

        {/* FORMULARIO */}
        <View style={styles.form}>

          {mode === 'register' && (
            <View style={styles.field}>
              <Text style={styles.label}>Cómo quieres que te llame</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre o como prefieras"
                placeholderTextColor="#B0BDB0"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@correo.com"
              placeholderTextColor="#B0BDB0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#B0BDB0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

        </View>

        {/* BOTÓN PRINCIPAL */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'login' ? 'Entrar' : 'Crear mi cuenta'}
            </Text>
          )}
        </TouchableOpacity>

        {/* CAMBIO DE MODO */}
        <TouchableOpacity
          onPress={() => setMode(m => m === 'login' ? 'register' : 'login')}
          style={styles.switchBtn}
        >
          <Text style={styles.switchText}>
            {mode === 'login'
              ? '¿Primera vez? '
              : '¿Ya tienes cuenta? '}
            <Text style={styles.switchLink}>
              {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
            </Text>
          </Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
    paddingHorizontal: 32,
    justifyContent: 'center',
  },

  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '300',
    color: '#2D3E2D',
    letterSpacing: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9EAA9E',
    textAlign: 'center',
    fontFamily: 'Quicksand_400Regular',
  },

  form: {
    marginBottom: 28,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#7A8E7A',
    marginBottom: 8,
    letterSpacing: 0.5,
    fontFamily: 'Quicksand_500Medium',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D4DDD4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#2D3E2D',
    fontFamily: 'Quicksand_400Regular',
  },

  button: {
    backgroundColor: '#4A664D',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4A664D',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: 'Quicksand_500Medium',
  },

  switchBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#7A8E7A',
    fontFamily: 'Quicksand_400Regular',
  },
  switchLink: {
    color: '#4A664D',
    textDecorationLine: 'underline',
    fontFamily: 'Quicksand_500Medium',
  },
});