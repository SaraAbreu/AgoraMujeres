import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../src/services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/useStore';
import { API_BASE } from '../../src/services/api';

export default function RegisterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { setToken, setUserData, setDeviceId } = useUserStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        setError('');
        if (!name.trim()) { setError('¿Cómo quieres que te llamemos? Añade tu nombre.'); return; }
        if (!email.trim()) { setError('Introduce tu dirección de email.'); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
        if (password !== confirm) { setError('Las contraseñas no coinciden. Revísalas.'); return; }

        setLoading(true);
        try {
            const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
            await updateProfile(result.user, { displayName: name.trim() });
            const firebaseToken = await result.user.getIdToken();
            const res = await fetch(`${API_BASE}/auth/social-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: firebaseToken }),
            });
            const data = await res.json();
            if (!res.ok) { console.error('BACKEND REGISTER ERROR:', data); throw new Error('Error registrando con backend'); }
            setToken(data.access_token);
            setDeviceId(data.user.uid);
            setUserData({ name: name.trim(), email: email.trim(), photo: null });
        } catch (err) {
            console.error('Error al registrar:', err);
            let msg = 'No pudimos crear tu cuenta. Inténtalo de nuevo.';
            if (err.code === 'auth/email-already-in-use') msg = 'Este email ya está registrado. ¿Quieres iniciar sesión?';
            else if (err.code === 'auth/invalid-email') msg = 'El email no es válido.';
            else if (err.code === 'auth/weak-password') msg = 'La contraseña es demasiado débil.';
            else if (err.code === 'auth/network-request-failed') msg = 'Sin conexión. Comprueba tu internet.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
                <View style={styles.logoCircle}>
                    <Image source={require('../../assets/images/logo-silueta.png')} style={styles.logoImage} resizeMode="contain" />
                </View>
                <Text style={styles.title}>Crear cuenta</Text>
                <View style={styles.divider} />
                <Text style={styles.subtitle}>Tu espacio seguro te espera</Text>

                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={18} color="#4A664D" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor="#B0B8B0" value={name} onChangeText={t => { setName(t); setError(''); }} autoCapitalize="words" />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={18} color="#4A664D" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#B0B8B0" value={email} onChangeText={t => { setEmail(t); setError(''); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={18} color="#4A664D" style={styles.inputIcon} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Contraseña" placeholderTextColor="#B0B8B0" value={password} onChangeText={t => { setPassword(t); setError(''); }} secureTextEntry={!showPass} />
                        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: 16 }}>
                            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#A0A8A0" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={18} color="#4A664D" style={styles.inputIcon} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Repite la contraseña" placeholderTextColor="#B0B8B0" value={confirm} onChangeText={t => { setConfirm(t); setError(''); }} secureTextEntry={!showPass} />
                    </View>
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={15} color="#C0392B" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}
                </View>

                {loading ? (
                    <ActivityIndicator color="#4A664D" size="large" style={{ marginTop: 10 }} />
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleRegister} activeOpacity={0.85}>
                        <Text style={styles.buttonText}>Crear mi cuenta</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={{ marginTop: 24 }} onPress={() => router.back()}>
                    <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
                </TouchableOpacity>
                <Text style={styles.footerText}>Al registrarte aceptas nuestras condiciones de seguridad.</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#FDFBF7', alignItems: 'center', paddingHorizontal: 30 },
    logoCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#EAF3DE', alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    logoImage: { width: '100%', height: '100%', transform: [{ scale: 2.1 }, { translateY: 5 }] },
    title: { fontSize: 26, fontWeight: '300', color: '#2D3E2D', letterSpacing: 2, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 12 },
    divider: { width: 30, height: 1, backgroundColor: '#4A664D', opacity: 0.35, marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#7A8E7A', fontStyle: 'italic', marginBottom: 32 },
    form: { width: '100%', maxWidth: 340, marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,102,77,0.25)', borderRadius: 14, backgroundColor: 'white', marginBottom: 14 },
    inputIcon: { paddingLeft: 16 },
    input: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 15, color: '#1A1A1A' },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF0EE', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F5C6C2' },
    errorText: { color: '#C0392B', fontSize: 13, marginLeft: 6, flex: 1 },
    button: { width: '100%', maxWidth: 340, backgroundColor: '#4A664D', borderRadius: 28, paddingVertical: 18, alignItems: 'center', shadowColor: '#4A664D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 8 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '500', letterSpacing: 1 },
    linkText: { fontSize: 13, color: '#4A664D', textDecorationLine: 'underline' },
    footerText: { marginTop: 30, fontSize: 11, color: '#999', textAlign: 'center' },
});
