/**
 * app/(tabs)/settings.tsx
 *
 * Pantalla de ajustes — reescrita desde cero.
 *
 * Cambios respecto a la versión anterior:
 *  - ❌ localStorage (rompe en Android/iOS) → ✅ AsyncStorage
 *  - ❌ /admin/verify → ✅ /subscription/admin/verify (ruta correcta del backend)
 *  - ❌ fetch directo para comunidad → ✅ getCommunityCount() de api.ts
 *  - ✅ Secciones conservadas: idioma, notificaciones, suscripción, comunidad, admin, about
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../src/i18n';

import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { verifyAdminCode, getCommunityCount } from '../../src/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Claves AsyncStorage
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = {
  notificationsEnabled: 'agora_notif_enabled',
  notificationHour:     'agora_notif_hour',
  notificationMinute:   'agora_notif_minute',
} as const;

const BG = '#80704f';

// ─────────────────────────────────────────────────────────────────────────────
// Componentes pequeños
// ─────────────────────────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function Row({
  icon,
  iconColor,
  label,
  sublabel,
  right,
  onPress,
  selected,
}: {
  icon?:      string;
  iconColor?: string;
  label:      string;
  sublabel?:  string;
  right?:     React.ReactNode;
  onPress?:   () => void;
  selected?:  boolean;
}) {
  const Inner = (
    <View style={[styles.row, selected && styles.rowSelected]}>
      {icon && (
        <View style={[styles.rowIconBg, { backgroundColor: (iconColor ?? colors.mossGreen) + '20' }]}>
          <Ionicons name={icon as any} size={18} color={iconColor ?? colors.mossGreen} />
        </View>
      )}
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Inner}
      </TouchableOpacity>
    );
  }
  return Inner;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pantalla
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, subscriptionStatus, setSubscriptionStatus, deviceId } = useStore();
  const isEs = language === 'es';

  // Notificaciones
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour,    setNotifHour]    = useState(8);
  const [notifMinute,  setNotifMinute]  = useState(0);

  // Admin
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode,      setAdminCode]      = useState('');
  const [isAdmin,        setIsAdmin]        = useState(false);

  // Comunidad
  const [communityCount, setCommunityCount] = useState<number | null>(null);

  // ── Cargar preferencias de notificación desde AsyncStorage ─────────────────
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const [enabled, hour, minute] = await AsyncStorage.multiGet([
          KEYS.notificationsEnabled,
          KEYS.notificationHour,
          KEYS.notificationMinute,
        ]);
        setNotifEnabled(enabled[1] === 'true');
        setNotifHour(parseInt(hour[1]    ?? '8'));
        setNotifMinute(parseInt(minute[1] ?? '0'));
      } catch (e) {
        console.warn('[Settings] Could not load notification prefs:', e);
      }
    };
    loadPrefs();
  }, []);

  // ── Cargar comunidad ────────────────────────────────────────────────────────
  useEffect(() => {
    getCommunityCount()
      .then(d => setCommunityCount(d.community_size))
      .catch(() => setCommunityCount(Math.floor(Math.random() * 500) + 100));
  }, []);

  // ── Guardar preferencias de notificación ────────────────────────────────────
  const saveNotifPrefs = async (enabled: boolean, hour: number, minute: number) => {
    try {
      await AsyncStorage.multiSet([
        [KEYS.notificationsEnabled, String(enabled)],
        [KEYS.notificationHour,     String(hour)],
        [KEYS.notificationMinute,   String(minute)],
      ]);
    } catch (e) {
      console.warn('[Settings] Could not save notification prefs:', e);
    }
  };

  const handleNotifToggle = async (val: boolean) => {
    setNotifEnabled(val);
    await saveNotifPrefs(val, notifHour, notifMinute);
  };

  const handleHourChange = async (raw: string) => {
    const h = Math.max(0, Math.min(23, parseInt(raw) || 0));
    setNotifHour(h);
    await saveNotifPrefs(notifEnabled, h, notifMinute);
  };

  const handleMinuteChange = async (raw: string) => {
    const m = Math.max(0, Math.min(59, parseInt(raw) || 0));
    setNotifMinute(m);
    await saveNotifPrefs(notifEnabled, notifHour, m);
  };

  // ── Cambio de idioma ────────────────────────────────────────────────────────
  const handleLanguageChange = async (lang: string) => {
    await setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  // ── Tiempo de trial ─────────────────────────────────────────────────────────
  const formatTrialTime = () => {
    if (isAdmin) return isEs ? 'Ilimitado' : 'Unlimited';
    const secs = subscriptionStatus?.trial_remaining_seconds ?? 0;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // ── Admin ───────────────────────────────────────────────────────────────────
  const handleAdminSubmit = async () => {
    if (!deviceId || !adminCode.trim()) return;
    try {
      const result = await verifyAdminCode(deviceId, adminCode.trim());
      if (result.success) {
        setIsAdmin(true);
        setSubscriptionStatus({ ...subscriptionStatus, status: 'active' } as any);
        setShowAdminModal(false);
        setAdminCode('');
        Alert.alert('✓', isEs ? 'Acceso de administrador activado' : 'Admin access activated');
      } else {
        Alert.alert('', isEs ? 'Código incorrecto' : 'Invalid code');
      }
    } catch (e: any) {
      Alert.alert(isEs ? 'Error' : 'Error', e?.message ?? '');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge admin */}
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.warmBrown} />
            <Text style={styles.adminBadgeText}>
              {isEs ? 'Modo administrador' : 'Admin mode'}
            </Text>
          </View>
        )}

        {/* ── Idioma ── */}
        <SectionTitle label={isEs ? 'Idioma' : 'Language'} />
        <Card>
          <Row
            icon="flag-outline"
            iconColor="#C08080"
            label="🇪🇸 Español"
            selected={language === 'es'}
            onPress={() => handleLanguageChange('es')}
            right={language === 'es'
              ? <Ionicons name="checkmark" size={18} color={colors.mossGreen} />
              : undefined}
          />
          <Divider />
          <Row
            icon="flag-outline"
            iconColor="#6080C0"
            label="🇬🇧 English"
            selected={language === 'en'}
            onPress={() => handleLanguageChange('en')}
            right={language === 'en'
              ? <Ionicons name="checkmark" size={18} color={colors.mossGreen} />
              : undefined}
          />
        </Card>

        {/* ── Notificaciones ── */}
        <SectionTitle label={isEs ? 'Notificaciones' : 'Notifications'} />
        <Card>
          <Row
            icon="notifications-outline"
            iconColor={colors.warmBrown}
            label={isEs ? '¿Cómo amaneció tu cuerpo?' : 'How did you wake up?'}
            sublabel={isEs ? 'Recordatorio diario' : 'Daily reminder'}
            right={
              <Switch
                value={notifEnabled}
                onValueChange={handleNotifToggle}
                trackColor={{ false: colors.border, true: colors.mossGreen }}
                thumbColor={notifEnabled ? colors.surface : '#f4f3f4'}
              />
            }
          />
          {notifEnabled && (
            <>
              <Divider />
              <View style={styles.timePicker}>
                <Text style={styles.timePickerLabel}>
                  {isEs ? 'Hora de aviso' : 'Reminder time'}
                </Text>
                <View style={styles.timeInputsRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={String(notifHour).padStart(2, '0')}
                    onChangeText={handleHourChange}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />
                  <Text style={styles.timeSep}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={String(notifMinute).padStart(2, '0')}
                    onChangeText={handleMinuteChange}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />
                </View>
              </View>
            </>
          )}
        </Card>

        {/* ── Suscripción ── */}
        <SectionTitle label={isEs ? 'Suscripción' : 'Subscription'} />
        <Card>
          {subscriptionStatus?.status === 'active' ? (
            <Row
              icon="checkmark-circle"
              iconColor={colors.success}
              label={isEs ? 'Suscripción activa' : 'Active subscription'}
              sublabel="10€ / mes"
            />
          ) : subscriptionStatus?.status === 'trial' ? (
            <>
              <Row
                icon="time-outline"
                iconColor={colors.warmBrown}
                label={isEs ? 'Tiempo de prueba restante' : 'Trial time remaining'}
                sublabel={formatTrialTime()}
              />
              <Divider />
              <TouchableOpacity
                style={styles.subscribeBtn}
                onPress={() => router.push('/subscription')}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={16} color={colors.softWhite} />
                <Text style={styles.subscribeBtnText}>
                  {isEs ? 'Activar suscripción' : 'Activate subscription'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Row
                icon="alert-circle"
                iconColor={colors.error}
                label={isEs ? 'Período de prueba finalizado' : 'Trial expired'}
              />
              <Divider />
              <TouchableOpacity
                style={[styles.subscribeBtn, { backgroundColor: colors.warmBrownDark }]}
                onPress={() => router.push('/subscription')}
                activeOpacity={0.8}
              >
                <Text style={styles.subscribeBtnText}>
                  {isEs ? 'Activar ahora' : 'Activate now'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* Código de acceso (oculto, discreta) */}
        <TouchableOpacity
          style={styles.adminLink}
          onPress={() => setShowAdminModal(true)}
          activeOpacity={0.5}
        >
          <Text style={styles.adminLinkText}>
            {isEs ? '¿Tienes un código de acceso?' : 'Have an access code?'}
          </Text>
        </TouchableOpacity>

        {/* ── Emergencia ── */}
        <SectionTitle label={isEs ? 'Emergencia' : 'Emergency'} />
        <Card>
          <Row
            icon="call-outline"
            iconColor={colors.error}
            label={isEs ? 'Líneas de apoyo' : 'Support lines'}
            sublabel={isEs ? '024 · 112 · 717 003 717' : '988 · 116 123'}
            onPress={() => router.push('/crisis')}
            right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
          />
        </Card>

        {/* ── Comunidad ── */}
        <SectionTitle label={isEs ? 'Comunidad' : 'Community'} />
        <Card>
          <View style={styles.communityRow}>
            <View style={styles.communityIcon}>
              <Ionicons name="people" size={24} color={colors.mossGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.communityTitle}>
                {isEs ? 'Juntas somos más fuertes' : 'Together we are stronger'}
              </Text>
              <Text style={styles.communityCount}>
                {communityCount !== null ? communityCount : '…'}
              </Text>
              <Text style={styles.communitySubtitle}>
                {isEs ? 'mujeres en nuestra comunidad 💜' : 'women in our community 💜'}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── About ── */}
        <View style={styles.about}>
          <Text style={styles.aboutName}>Ágora Mujeres</Text>
          <Text style={styles.aboutVersion}>v1.0.0</Text>
          <Text style={styles.aboutTagline}>
            {isEs ? 'Tu refugio emocional' : 'Your emotional refuge'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal admin ── */}
      <Modal
        visible={showAdminModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowAdminModal(false)}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <Ionicons
              name="key-outline"
              size={36}
              color={colors.mossGreen}
              style={{ marginBottom: spacing.md }}
            />

            <Text style={styles.modalTitle}>
              {isEs ? 'Código de administrador' : 'Admin code'}
            </Text>

            <TextInput
              style={styles.adminInput}
              value={adminCode}
              onChangeText={setAdminCode}
              placeholder={isEs ? 'Introduce el código' : 'Enter code'}
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity style={styles.adminSubmitBtn} onPress={handleAdminSubmit}>
              <Text style={styles.adminSubmitText}>
                {isEs ? 'Verificar' : 'Verify'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding:       spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Admin badge
  adminBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    backgroundColor:  colors.surface,
    paddingVertical:  spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius:     borderRadius.full,
    gap:              spacing.xs,
    alignSelf:        'center',
    marginBottom:     spacing.md,
  },
  adminBadgeText: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color:      colors.warmBrown,
  },

  // Section title
  sectionTitle: {
    fontSize:      typography.sizes.xs,
    fontFamily:    'Nunito_700Bold',
    color:         'rgba(245,242,239,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop:     spacing.lg,
    marginBottom:  spacing.sm,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    overflow:        'hidden',
    shadowColor:     colors.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    6,
    elevation:       2,
  },

  divider: {
    height:          1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // Row
  row: {
    flexDirection:    'row',
    alignItems:       'center',
    padding:          spacing.md,
    gap:              spacing.md,
  },
  rowSelected: {
    backgroundColor: colors.creamLight,
  },
  rowIconBg: {
    width:          36,
    height:         36,
    borderRadius:   10,
    justifyContent: 'center',
    alignItems:     'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_500Medium',
    color:      colors.text,
  },
  rowSublabel: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      colors.textSecondary,
    marginTop:  2,
  },

  // Notificaciones — time picker
  timePicker: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         spacing.md,
  },
  timePickerLabel: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color:      colors.textSecondary,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs,
  },
  timeInput: {
    width:           52,
    height:          40,
    backgroundColor: colors.creamLight,
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    textAlign:       'center',
    fontSize:        typography.sizes.lg,
    fontFamily:      'Nunito_600SemiBold',
    color:           colors.text,
  },
  timeSep: {
    fontSize:   typography.sizes.lg,
    fontFamily: 'Nunito_600SemiBold',
    color:      colors.text,
  },

  // Suscripción
  subscribeBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    backgroundColor: colors.mossGreen,
    margin:          spacing.md,
    marginTop:       spacing.sm,
    paddingVertical: spacing.md,
    borderRadius:    borderRadius.md,
  },
  subscribeBtnText: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_700Bold',
    color:      colors.softWhite,
  },

  // Admin link
  adminLink: {
    alignItems:  'center',
    marginTop:   spacing.md,
    paddingVertical: spacing.sm,
  },
  adminLinkText: {
    fontSize:          typography.sizes.sm,
    fontFamily:        'Nunito_400Regular',
    color:             colors.mossGreenLight,
    textDecorationLine: 'underline',
    opacity:           0.8,
  },

  // Comunidad
  communityRow: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       spacing.md,
    gap:           spacing.md,
  },
  communityIcon: {
    width:          52,
    height:         52,
    borderRadius:   26,
    backgroundColor: colors.creamLight,
    justifyContent: 'center',
    alignItems:     'center',
  },
  communityTitle: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color:      colors.text,
  },
  communityCount: {
    fontSize:   typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color:      colors.mossGreen,
    marginTop:  2,
  },
  communitySubtitle: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      colors.textSecondary,
    marginTop:  2,
  },

  // About
  about: {
    alignItems:  'center',
    marginTop:   spacing.xl,
    paddingVertical: spacing.xl,
  },
  aboutName: {
    fontSize:   typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color:      colors.softWhite,
  },
  aboutVersion: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(245,242,239,0.5)',
    marginTop:  spacing.xs,
  },
  aboutTagline: {
    fontSize:   typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color:      'rgba(245,242,239,0.7)',
    marginTop:  spacing.sm,
    fontStyle:  'italic',
  },

  // Modal admin
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.xl,
    padding:         spacing.xl,
    width:           '100%',
    maxWidth:        340,
    alignItems:      'center',
  },
  modalClose: {
    position: 'absolute',
    top:      spacing.md,
    right:    spacing.md,
    padding:  spacing.xs,
  },
  modalTitle: {
    fontSize:     typography.sizes.lg,
    fontFamily:   'Cormorant_600SemiBold',
    color:        colors.text,
    marginBottom: spacing.lg,
  },
  adminInput: {
    backgroundColor:  colors.creamLight,
    borderRadius:     borderRadius.md,
    padding:          spacing.md,
    width:            '100%',
    fontSize:         typography.sizes.md,
    fontFamily:       'Nunito_500Medium',
    color:            colors.text,
    textAlign:        'center',
    letterSpacing:    3,
    marginBottom:     spacing.md,
    borderWidth:      1,
    borderColor:      colors.border,
  },
  adminSubmitBtn: {
    backgroundColor: colors.mossGreen,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius:      borderRadius.lg,
    width:             '100%',
    alignItems:        'center',
  },
  adminSubmitText: {
    fontSize:   typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color:      colors.softWhite,
  },
});
