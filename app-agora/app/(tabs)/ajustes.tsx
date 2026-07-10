import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Platform, Alert, Linking, ActivityIndicator } from 'react-native';
import { useUserStore } from '../../store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { removeToken, getDeviceIdFromToken, getSubscriptionStatus, createCustomerPortalSession, SubscriptionStatus } from '../../services/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTrialTime(seconds: number): string {
  if (seconds <= 0) return '0 días';
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return days === 1 ? '1 día' : `${days} días`;
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return hours === 1 ? '1 hora' : `${hours} horas`;
  const mins = Math.floor(seconds / 60);
  return mins <= 1 ? '1 minuto' : `${mins} minutos`;
}

// ─── Componente de suscripción ────────────────────────────────────────────────

interface SubscriptionCardProps {
  deviceId: string;
  router: ReturnType<typeof useRouter>;
}

function SubscriptionCard({ deviceId, router }: SubscriptionCardProps) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    getSubscriptionStatus(deviceId).then(s => {
      setStatus(s);
      setLoading(false);
    });
  }, [deviceId]);

  const handleManage = async () => {
    setPortalLoading(true);
    const url = await createCustomerPortalSession(deviceId);
    setPortalLoading(false);
    if (url) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No se pudo abrir el portal de gestión. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <View style={subStyles.card}>
        <ActivityIndicator size="small" color="#C5A059" />
      </View>
    );
  }

  // trial con tiempo restante → mostrar countdown + upgrade
  if (!status || status.status === 'trial') {
    const remaining = status?.trial_remaining_seconds ?? 5400;
    return (
      <View style={subStyles.card}>
        <View style={subStyles.row}>
          <View style={subStyles.iconWrap}>
            <Ionicons name="time-outline" size={20} color="#C5A059" />
          </View>
          <View style={subStyles.body}>
            <Text style={subStyles.planName}>Exploración libre</Text>
            <Text style={subStyles.planDesc}>
              {remaining > 0
                ? `Te quedan ${formatTrialTime(remaining)} de prueba gratuita`
                : 'Tu mes de prueba ha terminado'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={subStyles.upgradeBtn} onPress={() => router.push('/plan' as any)} activeOpacity={0.85}>
          <Text style={subStyles.upgradeBtnText}>Ver planes</Text>
          <Ionicons name="arrow-forward-outline" size={14} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  // expirado → solo CTA
  if (status.status === 'expired') {
    return (
      <View style={subStyles.card}>
        <View style={subStyles.row}>
          <View style={subStyles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#A0331F" />
          </View>
          <View style={subStyles.body}>
            <Text style={subStyles.planName}>Prueba agotada</Text>
            <Text style={subStyles.planDesc}>Activa un plan para seguir usando Ágora</Text>
          </View>
        </View>
        <TouchableOpacity style={subStyles.upgradeBtn} onPress={() => router.push('/plan' as any)} activeOpacity={0.85}>
          <Text style={subStyles.upgradeBtnText}>Activar plan</Text>
          <Ionicons name="arrow-forward-outline" size={14} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  // activo (o admin) → mostrar portal de gestión
  return (
    <View style={[subStyles.card, subStyles.cardActive]}>
      <LinearGradient colors={['rgba(197,160,89,0.08)', 'rgba(139,90,43,0.06)']} style={StyleSheet.absoluteFill} />
      <View style={subStyles.row}>
        <View style={[subStyles.iconWrap, subStyles.iconWrapActive]}>
          <Ionicons name="star" size={18} color="#C5A059" />
        </View>
        <View style={subStyles.body}>
          <Text style={subStyles.planName}>
            {status.is_admin ? 'Acceso Admin' : 'Plan activo'}
          </Text>
          <Text style={subStyles.planDesc}>Acceso ilimitado al santuario</Text>
        </View>
      </View>
      {!status.is_admin && (
        <TouchableOpacity style={subStyles.manageBtn} onPress={handleManage} disabled={portalLoading} activeOpacity={0.85}>
          {portalLoading
            ? <ActivityIndicator size="small" color="#8B5A2B" />
            : <>
                <Text style={subStyles.manageBtnText}>Gestionar suscripción</Text>
                <Ionicons name="open-outline" size={14} color="#8B5A2B" />
              </>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AjustesScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const clearSession = useUserStore((state) => state.clearSession);
  const devMode = useUserStore((state) => state.devMode);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceIdFromToken().then(id => setDeviceId(id));
  }, []);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      await removeToken();
      await clearSession();
      // Antes: window.location.href = '/login' — provocaba una recarga completa
      // de página. Al recargar, la lógica de detección de PWA standalone en
      // _layout.tsx raíz se re-ejecutaba y, sin token, redirigía a /bienvenida
      // en vez de dejar a la usuaria en /login. router.replace() navega dentro
      // de la SPA sin recargar, así que ese efecto no se vuelve a disparar.
      router.replace('/login');
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

        {/* SUSCRIPCIÓN */}
        {deviceId && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MI SUSCRIPCIÓN</Text>
            <SubscriptionCard deviceId={deviceId} router={router} />
          </View>
        )}

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
          <Text style={styles.sectionLabel}>MI SALUD</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/ciclo')}>
            <View style={styles.rowLeft}>
              <Ionicons name="sync-circle-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Mi Ciclo</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/glucosa')}>
            <View style={styles.rowLeft}>
              <Ionicons name="water-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Glucosa</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C5A059" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/sintomas-cronico')}>
            <View style={styles.rowLeft}>
              <Ionicons name="body-outline" size={20} color="#8B5A2B" />
              <Text style={styles.rowText}>Síntomas</Text>
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

// ─── Estilos de suscripción ───────────────────────────────────────────────────

const subStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    gap: 14,
  },
  cardActive: {
    borderColor: 'rgba(197,160,89,0.4)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(197,160,89,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: 'rgba(197,160,89,0.15)' },
  body: { flex: 1, gap: 3 },
  planName: { fontSize: 15, fontWeight: '600', color: '#8B5A2B' },
  planDesc: { fontSize: 12, color: '#8B5A2B', opacity: 0.6, lineHeight: 17 },
  cancelNote: { fontSize: 11, color: '#A0331F', marginTop: 2 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#8B5A2B',
    paddingVertical: 12, borderRadius: 14,
  },
  upgradeBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(139,90,43,0.3)',
    paddingVertical: 11, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  manageBtnText: { color: '#8B5A2B', fontWeight: '600', fontSize: 13 },
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