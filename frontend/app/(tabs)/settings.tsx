import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Image, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/useStore';
import { useTrialCheck } from '../../src/hooks/useTrialCheck';

// ── Tokens del sistema ────────────────────────────────────────
const C = {
  forestDeep: '#2C3D2E',
  forest: '#4A664D',
  forestDim: '#3A5140',
  moss: '#6B8F6E',
  sage: '#A8C5A0',
  mint: '#D4E8D0',
  mintSoft: '#EAF4E8',
  cream: '#F8F7F2',
  parchment: '#F0EDE4',
  warm: '#E8E2D8',
  muted: '#9A958E',
  charcoal: '#3D3A35',
  white: '#FFFFFF',
  gold: '#C9A84C',
};

// ── Componente fila de ajuste ─────────────────────────────────
function SettingRow({
  icon, iconBg, iconColor, label, sublabel, right, noBorder,
}: {
  icon: string; iconBg: string; iconColor: string;
  label: string; sublabel?: string;
  right?: React.ReactNode; noBorder?: boolean;
}) {
  return (
    <View style={[st.settingRow, noBorder && { borderBottomWidth: 0 }]}>
      <View style={[st.settingIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.settingLabel}>{label}</Text>
        {sublabel ? <Text style={st.settingSubLabel}>{sublabel}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// ── Componente sección ────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={st.section}>
      <Text style={st.sectionEyebrow}>{title}</Text>
      <View style={st.card}>{children}</View>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData, deviceId, contador, logout } = useUserStore();
  const [language, setLanguage] = useState(i18n.language);
  const { isTrialActive, isSubscribed, remainingTime } = useTrialCheck();
  const [enableVoiceOutput, setEnableVoiceOutput] = useState(false);

  const toggleLang = async () => {
    const next = language === 'es' ? 'en' : 'es';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    const confirmed = window.confirm('¿Estás segura de que quieres salir de tu refugio?');
    if (confirmed) {
      logout();
      router.replace('/');
    }
  };

  const handleDeleteAccount = async () => {
    const step1 = window.confirm(
      '¿Eliminar tu cuenta?\n\nSe borrarán todos tus datos: diario, patrones, historial de chat y suscripción. Esta acción no se puede deshacer.'
    );
    if (!step1) return;
    const step2 = window.confirm(
      'Última confirmación: todos tus datos serán eliminados permanentemente. ¿Continuar?'
    );
    if (!step2) return;
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://agora.syntexia-solutions.es/api';
      const res = await fetch(`${apiUrl}/auth/delete-account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId }),
      });
      if (!res.ok) throw new Error('Error del servidor');
      logout();
      router.replace('/');
    } catch {
      window.alert('Ha ocurrido un error al eliminar la cuenta. Por favor, escríbenos a hola@agoramujeres.es y lo gestionamos manualmente.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>

      {/* ── Header ── */}
      <LinearGradient
        colors={[C.forestDeep, C.forest]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[st.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={st.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
            <Ionicons name="chevron-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={st.headerEyebrow}>Mi Refugio</Text>
            <Text style={st.headerTitle}>Ajustes</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 60 }]}
      >

        {/* ── Perfil ── */}
        <Section title="Mi Perfil">
          {/* Avatar + nombre */}
          <View style={st.profileRow}>
            {userData?.photo ? (
              <Image source={{ uri: userData.photo }} style={st.avatar} />
            ) : (
              <View style={st.avatarPlaceholder}>
                <Ionicons name="person" size={28} color={C.moss} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={st.userName}>{userData?.name || 'Compañera de Ágora'}</Text>
              <Text style={st.userEmail}>{userData?.email || 'Sesión no iniciada'}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={st.statsRow}>
            <View style={st.statBox}>
              <Text style={st.statNum}>{contador}</Text>
              <Text style={st.statLbl}>Días en calma</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.statBox}>
              <Text style={st.statNum}>100%</Text>
              <Text style={st.statLbl}>Privacidad</Text>
            </View>
          </View>
        </Section>

        {/* ── Suscripción ── */}
        <Section title="Suscripción">
          <SettingRow
            icon={isSubscribed ? 'shield-checkmark-outline' : 'time-outline'}
            iconBg={isSubscribed ? C.mintSoft : '#FFF6E6'}
            iconColor={isSubscribed ? C.forest : C.gold}
            label={isSubscribed ? 'Plan activo' : 'Tiempo de prueba'}
            sublabel={isTrialActive && remainingTime ? remainingTime : undefined}
            noBorder
            right={
              !isSubscribed ? (
                <TouchableOpacity
                  onPress={() => router.push('/subscription')}
                  style={st.planBadge}
                >
                  <Text style={st.planBadgeText}>7.90 €/mes</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </Section>

        {/* ── Preferencias ── */}
        <Section title="Preferencias">
          <SettingRow
            icon="globe-outline"
            iconBg={C.mintSoft}
            iconColor={C.forest}
            label={language === 'es' ? 'Español' : 'English'}
            right={
              <TouchableOpacity onPress={toggleLang} style={st.langToggle}>
                <Text style={st.langToggleText}>{language === 'es' ? 'EN' : 'ES'}</Text>
              </TouchableOpacity>
            }
          />
          <SettingRow
            icon="volume-medium-outline"
            iconBg={C.mintSoft}
            iconColor={C.moss}
            label="Audio Guía"
            noBorder
            right={
              <Switch
                value={enableVoiceOutput}
                onValueChange={setEnableVoiceOutput}
                trackColor={{ false: C.warm, true: C.sage }}
                thumbColor={enableVoiceOutput ? C.forest : C.muted}
                ios_backgroundColor={C.warm}
              />
            }
          />
        </Section>

        {/* ── Cerrar sesión ── */}
        <TouchableOpacity onPress={handleLogout} style={st.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color="#C0614A" />
          <Text style={st.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* ── Eliminar cuenta ── */}
        <View style={st.deleteZone}>
          <View style={st.deleteLine} />
          <Text style={st.deleteInfo}>
            Puedes eliminar tu cuenta y todos tus datos en cualquier momento.
          </Text>
          <TouchableOpacity onPress={handleDeleteAccount} style={st.deleteBtn}>
            <Ionicons name="trash-outline" size={14} color="#C0392B" />
            <Text style={st.deleteText}>Eliminar mi cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Device ID (oculto / tap) */}
        <Text style={st.deviceId}>ID de dispositivo: {deviceId?.substring(0, 8)}...</Text>

      </ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────
const st = StyleSheet.create({

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerEyebrow: {
    fontSize: 10, color: C.sage,
    textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 2,
  },
  headerTitle: {
    color: C.white, fontSize: 22, fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.3,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 4 },

  // Section
  sectionEyebrow: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 2.5,
    marginBottom: 8, marginTop: 20, paddingHorizontal: 2,
  },
  section: {},
  card: {
    backgroundColor: C.white, borderRadius: 20,
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    overflow: 'hidden',
  },

  // Perfil
  profileRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, paddingBottom: 14,
  },
  avatar: { width: 58, height: 58, borderRadius: 29 },
  avatarPlaceholder: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.mintSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  userName: {
    fontSize: 17, fontWeight: '600', color: C.charcoal, marginBottom: 3,
  },
  userEmail: { fontSize: 12, color: C.muted },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: C.warm,
    marginHorizontal: 18, paddingVertical: 14,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: {
    fontSize: 22, fontWeight: '300', color: C.forest,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.5,
  },
  statLbl: { fontSize: 10, color: C.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 },
  statDivider: { width: 1, backgroundColor: C.warm, marginVertical: 4 },

  // Setting row
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1, borderBottomColor: C.warm,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontSize: 15, color: C.charcoal, fontWeight: '500' },
  settingSubLabel: { fontSize: 11, color: C.muted, marginTop: 2 },

  // Plan badge
  planBadge: {
    backgroundColor: '#FFF6E6',
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#F0D9A0',
  },
  planBadgeText: {
    fontSize: 11, fontWeight: '700', color: C.gold,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Lang toggle
  langToggle: {
    backgroundColor: C.mintSoft, borderRadius: 100,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: C.mint,
  },
  langToggleText: {
    fontSize: 11, fontWeight: '700', color: C.forest,
    letterSpacing: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 28,
  },
  logoutText: { fontSize: 15, color: '#C0614A', fontWeight: '600' },

  // Delete
  deleteZone: { alignItems: 'center', marginTop: 20, gap: 8, paddingHorizontal: 24 },
  deleteLine: { width: 32, height: 1, backgroundColor: C.warm },
  deleteInfo: {
    fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 17,
  },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  deleteText: { fontSize: 13, color: '#C0392B', fontWeight: '500' },

  // Device ID
  deviceId: {
    fontSize: 10, color: C.muted, textAlign: 'center', marginTop: 20,
  },
});
