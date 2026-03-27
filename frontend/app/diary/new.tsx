import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { GlassCard, PremiumButton } from '../../src/components/ui';
import { useStore } from '../../src/store/useStore';
import {
  createDiaryEntry,
  type EmotionalState,
  type PhysicalState,
  type WeatherData,
} from '../../src/services/api';
import { colors, textStyles, sp, fonts } from '../../src/theme';

const EMOTIONS: { key: keyof EmotionalState; emoji: string }[] = [
  { key: 'calma', emoji: '😌' },
  { key: 'fatiga', emoji: '😴' },
  { key: 'niebla_mental', emoji: '🌫️' },
  { key: 'dolor_difuso', emoji: '💔' },
  { key: 'gratitud', emoji: '🙏' },
  { key: 'tension', emoji: '😤' },
];

export default function NewDiaryEntry() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useStore();

  const [text, setText] = useState('');
  const [emotions, setEmotions] = useState<EmotionalState>({});
  const [showPhysical, setShowPhysical] = useState(false);
  const [physical, setPhysical] = useState<PhysicalState>({
    nivel_dolor: 0,
    energia: 5,
    sensibilidad: 0,
  });
  const [saving, setSaving] = useState(false);
  const [weather, setWeather] = useState<WeatherData | undefined>();

  const setEmotion = (key: string, val: number) => {
    Haptics.selectionAsync();
    setEmotions((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!deviceId || deviceId === 'default-device') {
      Alert.alert('Error', 'DeviceId inválido. Reinicia la app o revisa la configuración.');
      return;
    }

    setSaving(true);

    try {
      const result = await createDiaryEntry({
        device_id: deviceId,
        texto: text.trim() || undefined,
        emotional_state: emotions,
        physical_state: showPhysical ? physical : undefined,
        weather,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✨', t('entrySaved'));
      router.back();
    } catch (err) {
      console.log('Error al guardar entrada de diario:', err);
      Alert.alert('Error', t('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('newEntry')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Texto libre */}
        <Text style={styles.sectionTitle}>{t('howDoYouFeel')}</Text>
        <GlassCard>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder={t('writeThoughts')}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </GlassCard>

        {/* Emociones */}
        <Text style={styles.sectionTitle}>{t('emotionalTrends')}</Text>
        {EMOTIONS.map(({ key, emoji }) => (
          <GlassCard key={key} style={styles.emotionCard}>
            <View style={styles.emotionHeader}>
              <Text style={styles.emotionEmoji}>{emoji}</Text>
              <Text style={styles.emotionLabel}>{t(key)}</Text>
              <Text
                style={[
                  styles.emotionValue,
                  { color: (colors.emotion as any)[key] || colors.primary },
                ]}
              >
                {(emotions[key] || 0).toFixed(0)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5}
              step={1}
              value={emotions[key] || 0}
              onValueChange={(v) => setEmotion(key, v)}
              minimumTrackTintColor={(colors.emotion as any)[key] || colors.primary}
              maximumTrackTintColor={colors.borderLight}
              thumbTintColor={(colors.emotion as any)[key] || colors.primary}
            />
          </GlassCard>
        ))}

        {/* Estado físico */}
        <TouchableOpacity
          onPress={() => setShowPhysical(!showPhysical)}
          style={styles.physicalToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPhysical ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.physicalToggleText}>{t('physicalState')}</Text>
        </TouchableOpacity>

        {showPhysical && (
          <GlassCard style={styles.physicalCard}>
            {[
              { key: 'nivel_dolor', max: 10, color: colors.error },
              { key: 'energia', max: 10, color: colors.accent },
              { key: 'sensibilidad', max: 10, color: colors.secondary },
            ].map(({ key, max, color }) => (
              <View key={key} style={styles.physicalRow}>
                <Text style={styles.physicalLabel}>{t(key)}</Text>
                <Slider
                  style={styles.sliderWide}
                  minimumValue={0}
                  maximumValue={max}
                  step={1}
                  value={physical[key]}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setPhysical((p) => ({ ...p, [key]: v }));
                  }}
                  minimumTrackTintColor={color}
                  maximumTrackTintColor={colors.borderLight}
                  thumbTintColor={color}
                />
                <Text style={[styles.physicalValue, { color }]}>{physical[key]}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        <View style={{ height: sp.lg }} />

        <PremiumButton
          title={t('saveEntry')}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          size="lg"
          style={{ marginHorizontal: sp.screenX }}
        />

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp.screenX,
    paddingVertical: sp.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...textStyles.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: sp.screenX, paddingBottom: 40 },

  sectionTitle: {
    ...textStyles.labelCaps,
    color: colors.textMuted,
    marginTop: sp.lg,
    marginBottom: sp.sm,
  },

  textInput: {
    ...textStyles.body,
    color: colors.textPrimary,
    minHeight: 120,
    lineHeight: 24,
  },

  emotionCard: { marginBottom: sp.sm, paddingVertical: sp.sm },
  emotionHeader: { flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginBottom: 4 },
  emotionEmoji: { fontSize: 20 },
  emotionLabel: { ...textStyles.subtitleSm, color: colors.textPrimary, flex: 1 },
  emotionValue: { ...textStyles.subtitle, fontFamily: fonts.sansBold, width: 24, textAlign: 'right' },
  slider: { height: 32 },

  physicalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: sp.lg,
    marginBottom: sp.sm,
  },
  physicalToggleText: { ...textStyles.label, color: colors.primary },

  physicalCard: { gap: sp.md },
  physicalRow: { gap: 4 },
  physicalLabel: { ...textStyles.label, color: colors.textSecondary },
  sliderWide: { height: 32, marginHorizontal: -8 },
  physicalValue: { ...textStyles.bodySm, fontFamily: fonts.sansBold, textAlign: 'right' },
});
