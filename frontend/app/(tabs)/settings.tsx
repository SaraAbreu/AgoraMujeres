import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, TextInput, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';
import { ScreenContainer, GlassCard, PremiumButton } from '../../src/components/ui';
import { useUserStore } from '../../src/store/useStore'; // 👈 Usamos el store unificado
import { useTrialCheck } from '../../src/hooks/useTrialCheck';
import { verifyAdminCode } from '../../src/services/api';
import { colors, textStyles, sp, radius, fonts } from '../../src/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  
  // ── ESTADO UNIFICADO ──
  const { userData, deviceId, contador, logout } = useUserStore();
  
  const [language, setLanguage] = useState(i18n.language);
  const { isTrialActive, isSubscribed, remainingTime } = useTrialCheck();
  const [enableVoiceOutput, setEnableVoiceOutput] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);

  const toggleLang = async () => {
    const next = language === 'es' ? 'en' : 'es';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás segura de que quieres salir de tu refugio?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive", 
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          } 
        }
      ]
    );
  };

  return (
    <ScreenContainer title={t('settings')}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── SECCIÓN DE PERFIL (NUEVA) ────────── */}
        <Text style={styles.sectionTitle}>Mi Perfil</Text>
        <GlassCard>
          <View style={styles.profileRow}>
            {userData?.photo ? (
              <Image source={{ uri: userData.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={30} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: sp.md }}>
              <Text style={styles.userName}>{userData?.name || 'Compañera de Ágora'}</Text>
              <Text style={styles.userEmail}>{userData?.email || 'Sesión no iniciada'}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{contador}</Text>
              <Text style={styles.statLabel}>Días en calma</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Privacidad</Text>
            </View>
          </View>
        </GlassCard>

        {/* ── Suscripción ────────── */}
        <Text style={styles.sectionTitle}>{t('subscription')}</Text>
        <GlassCard>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons
                name={isSubscribed ? 'shield-checkmark' : 'time-outline'}
                size={20}
                color={isSubscribed ? colors.success : colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>
                {isSubscribed ? t('subscriptionActive') : t('trialRemaining')}
              </Text>
              {isTrialActive && <Text style={styles.rowValue}>{remainingTime}</Text>}
            </View>
            {!isSubscribed && (
              <TouchableOpacity onPress={() => router.push('/subscription')} style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>{t('priceMonthly')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* ── Idioma y Voz ────────── */}
        <Text style={styles.sectionTitle}>Preferencia</Text>
        <GlassCard>
          <View style={[styles.row, { marginBottom: sp.md }]}>
            <View style={styles.rowIcon}><Ionicons name="globe-outline" size={20} color={colors.primary} /></View>
            <Text style={[styles.rowLabel, { flex: 1 }]}>{language === 'es' ? t('spanish') : t('english')}</Text>
            <TouchableOpacity onPress={toggleLang} style={styles.langToggle}>
              <Text style={styles.langToggleText}>{language === 'es' ? 'EN' : 'ES'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.rowIcon}><Ionicons name="volume-high-outline" size={20} color={colors.accent} /></View>
            <Text style={[styles.rowLabel, { flex: 1 }]}>Audio Guía</Text>
            <Switch
              value={enableVoiceOutput}
              onValueChange={setEnableVoiceOutput}
              trackColor={{ false: colors.bg, true: colors.primarySoft }}
              thumbColor={enableVoiceOutput ? colors.primary : colors.textMuted}
            />
          </View>
        </GlassCard>

        {/* ── Botón Salir ────────── */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#FF6666" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* ── Admin (Oculto) ────────── */}
        <TouchableOpacity onPress={() => setShowAdmin(!showAdmin)} style={styles.adminToggle}>
          <Text style={styles.adminToggleText}>ID de dispositivo: {deviceId?.substring(0,8)}...</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  sectionTitle: { ...textStyles.labelCaps, color: colors.textMuted, marginTop: sp.lg, marginBottom: sp.sm },
  
  // Estilos de Perfil
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: sp.lg },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  userName: { ...textStyles.h1, color: colors.textPrimary },
  userEmail: { ...textStyles.bodySm, color: colors.textMuted },
  
  statsRow: { flexDirection: 'row', paddingTop: sp.md, borderTopWidth: 1, borderTopColor: colors.bg },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { ...textStyles.h1, color: colors.primary },
  statLabel: { ...textStyles.bodySm, color: colors.textMuted, fontSize: 10 },
  statDivider: { width: 1, backgroundColor: colors.bg },

  row: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  rowIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...textStyles.subtitle, color: colors.textPrimary },
  rowValue: { ...textStyles.bodySm, color: colors.textMuted, marginTop: 2 },
  upgradeBtn: { backgroundColor: colors.primarySoft, paddingHorizontal: sp.md, paddingVertical: 6, borderRadius: radius.full },
  upgradeBtnText: { ...textStyles.labelCaps, color: colors.accent },
  langToggle: { backgroundColor: colors.primarySoft, paddingHorizontal: sp.md, paddingVertical: 6, borderRadius: radius.full },
  langToggleText: { ...textStyles.labelCaps, color: colors.primary, fontFamily: fonts.sansBold },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: sp.xl, gap: sp.sm },
  logoutText: { ...textStyles.subtitle, color: '#FF6666', fontWeight: 'bold' },

  adminToggle: { alignItems: 'center', marginTop: sp.md },
  adminToggleText: { fontSize: 10, color: colors.textMuted },
});