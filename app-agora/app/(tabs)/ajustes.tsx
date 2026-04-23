import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Platform, TextInput, Alert } from 'react-native';
import { useUserStore } from '../../store/userStore';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { removeToken } from '../../services/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AjustesScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const clearSession = useUserStore((state) => state.clearSession);
  const devMode = useUserStore((state) => state.devMode);
  const setDevMode = useUserStore((state) => state.setDevMode);
  const [devCode, setDevCode] = useState('');
  const [devMsg, setDevMsg] = useState('');
  const [devSuccess, setDevSuccess] = useState(false);

  const handleDevCode = () => {
    if (devCode.trim() === 'AGORAADMIN26') {
      setDevMode(true);
      setDevSuccess(true);
      setDevMsg('¡Modo desarrollador activado!');
    } else {
      setDevMode(false);
      setDevSuccess(false);
      setDevMsg('Código incorrecto. Inténtalo de nuevo.');
      setDevCode('');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      await removeToken();
      await clearSession();
      window.location.href = '/login';
    } else {
      Alert.alert(
        'Cerrar sesión',
        '¿Estás segura de que quieres cerrar sesión? Se eliminarán todos los datos locales.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar sesión',
            style: 'destructive',
            onPress: async () => {
              await removeToken();
              await clearSession();
              setTimeout(() => router.replace('/login'), 100);
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>MIS DATOS</Text>

        {/* PERFIL RESUMEN */}
        <View style={styles.profileCard}>
          {/* Avatar con iniciales */}
          <LinearGradient colors={['#C5A059', '#8B5A2B']} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {user?.name
                ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                : '?'}
            </Text>
          </LinearGradient>

          <Text style={styles.userName}>{user?.name || 'Nombre no disponible'}</Text>

          {/* Badge de plan — cambia según devMode */}
          {devMode ? (
            <View style={styles.planBadgeActive}>
              <Ionicons name="star" size={11} color="#C5A059" />
              <Text style={styles.planBadgeActiveText}>Plan Ágora Premium</Text>
            </View>
          ) : user?.plan ? (
            <View style={styles.planBadgeActive}>
              <Ionicons name="star" size={11} color="#C5A059" />
              <Text style={styles.planBadgeActiveText}>Plan {user.plan}</Text>
            </View>
          ) : (
            <Text style={styles.userType}>· Exploración libre ·</Text>
          )}
        </View>

        {/* SECCIONES DE AJUSTES */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/identificacion-biometria')}>
            <View style={styles.rowLeft}>
              <Ionicons name="finger-print-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Identificación y Biometría</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/historial-clinico')}>
            <View style={styles.rowLeft}>
              <Ionicons name="medkit-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Historial Clínico</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SANTUARIO</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/recordatorios-salud')}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Recordatorios de Salud</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/politica-privacidad')}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Política de Privacidad</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>
        </View>

        {/* CÓDIGO DE DESARROLLADOR */}
        <View style={styles.devSection}>
          <Text style={styles.sectionLabel}>DESARROLLADOR</Text>
          <BlurDevCodeInput
            value={devCode}
            onChangeText={(text) => {
              setDevCode(text);
              setDevMsg('');
            }}
            onPress={handleDevCode}
            devMsg={devMsg}
            devSuccess={devSuccess}
            devMode={devMode}
          />
        </View>

        {/* CERRAR SESIÓN */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient
            colors={['#8B5A2B', '#6B3F1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={18} color="white" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* FOOTER — SYNTEXIA SOLUTIONS */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerLabel}>DESARROLLADO POR</Text>
          <Text style={styles.footerBrand}>Syntexia Solutions</Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
        </View>

      </ScrollView>
    </View>
  );
}

interface BlurDevCodeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onPress: () => void;
  devMsg: string;
  devSuccess: boolean;
  devMode: boolean;
}

function BlurDevCodeInput({ value, onChangeText, onPress, devMsg, devSuccess, devMode }: BlurDevCodeInputProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const showClear = focused || hovered || devMode;
  const isWeb = Platform.OS === 'web';

  return (
    <View style={devInputStyles.wrapper}>
      <View style={devInputStyles.row}>
        <View
          style={devInputStyles.inputContainer}
          {...(isWeb ? {
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
          } : {})}
        >
          {!showClear && (
            isWeb
              ? <View style={[devInputStyles.blurOverlay, { filter: 'blur(6px)' } as any]} />
              : <BlurView intensity={25} style={devInputStyles.blurOverlay} />
          )}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Introduce el código"
            placeholderTextColor="#C5A059"
            style={devInputStyles.input}
            autoCapitalize="characters"
            secureTextEntry={!showClear && !devMode}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onPress}
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          onPress={onPress}
          style={[devInputStyles.activateBtn, devMode && devInputStyles.activateBtnActive]}
          activeOpacity={0.8}
          disabled={devMode}
        >
          <Ionicons
            name={devMode ? 'checkmark-circle' : 'key-outline'}
            size={16}
            color="white"
          />
          <Text style={devInputStyles.activateBtnText}>
            {devMode ? 'Activo' : 'Activar'}
          </Text>
        </TouchableOpacity>
      </View>

      {!!devMsg && (
        <View style={[devInputStyles.msgContainer, devSuccess ? devInputStyles.msgSuccess : devInputStyles.msgError]}>
          <Ionicons
            name={devSuccess ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={14}
            color={devSuccess ? '#2D7A4F' : '#A0331F'}
          />
          <Text style={[devInputStyles.msgText, devSuccess ? devInputStyles.msgTextSuccess : devInputStyles.msgTextError]}>
            {devMsg}
          </Text>
        </View>
      )}

      {devMode && (
        <View style={devInputStyles.activeBadge}>
          <Ionicons name="code-slash-outline" size={12} color="#2D7A4F" />
          <Text style={devInputStyles.activeBadgeText}>Modo desarrollador activo</Text>
        </View>
      )}
    </View>
  );
}

const devInputStyles = StyleSheet.create({
  wrapper: { width: '100%', gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputContainer: { flex: 1, position: 'relative' },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#C5A059',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    color: '#8B5A2B',
    zIndex: 1,
  },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activateBtnActive: { backgroundColor: '#2D7A4F' },
  activateBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  msgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  msgSuccess: {
    backgroundColor: 'rgba(45,122,79,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45,122,79,0.3)',
  },
  msgError: {
    backgroundColor: 'rgba(160,51,31,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(160,51,31,0.2)',
  },
  msgText: { fontSize: 13 },
  msgTextSuccess: { color: '#2D7A4F', fontWeight: '500' },
  msgTextError: { color: '#A0331F' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45,122,79,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(45,122,79,0.25)',
  },
  activeBadgeText: {
    fontSize: 11,
    color: '#2D7A4F',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 60 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '200',
    letterSpacing: 5,
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 30,
  },
  profileCard: { alignItems: 'center', marginBottom: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '300',
    color: 'white',
    letterSpacing: 2,
  },
  userName: { fontSize: 20, fontWeight: '300', color: '#8B5A2B', marginBottom: 8 },
  userType: { fontSize: 12, color: '#8B5A2B', opacity: 0.45, letterSpacing: 1, marginTop: 2 },
  planBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(197,160,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.35)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  planBadgeActiveText: {
    fontSize: 12,
    color: '#8B5A2B',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  section: { marginBottom: 30 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8B5A2B',
    opacity: 0.5,
    letterSpacing: 2,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 18,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontSize: 15, color: '#8B5A2B', fontWeight: '300' },

  // Sección dev con tarjeta
  devSection: {
    marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },

  // Botón de cerrar sesión — prominente con gradiente
  logoutBtn: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    gap: 4,
  },
  footerDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(139,90,43,0.2)',
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: '#8B5A2B',
    opacity: 0.4,
    fontWeight: '600',
  },
  footerBrand: {
    fontSize: 13,
    color: '#8B5A2B',
    fontWeight: '300',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  footerVersion: {
    fontSize: 10,
    color: '#C5A059',
    opacity: 0.5,
    marginTop: 2,
  },
});