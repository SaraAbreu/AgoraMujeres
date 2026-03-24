import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, TYPO } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { getCrisisSupport, CrisisResponse } from '../services/api';
import { useStore } from '../store/useStore';

export function CrisisSupport() {
  const [crisisData, setCrisisData] = useState<CrisisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const router = useRouter();
  const { deviceId } = useStore();

  const callCrisisAPI = async (painLevel: number = 9) => {
    setLoading(true);
    try {
      const response = await getCrisisSupport(
        deviceId || 'default-device',
        painLevel,
        'es',
        ['mucho_dolor', 'ansiedad']
      );
      setCrisisData(response);
      setSelectedTechnique(response.technique?.title);
    } catch (error) {
      console.error('Error calling crisis API:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    callCrisisAPI();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Suggested Technique */}
      {crisisData?.technique && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{crisisData.technique.title}</Text>
          <Text style={styles.cardMessage}>{crisisData.technique.message}</Text>
          
          {crisisData.technique.steps && (
            <View style={styles.stepsContainer}>
              {crisisData.technique.steps.map((step, index) => (
                <View key={index} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Emergency Resources */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🆘 Recursos de apoyo</Text>
        
        {[
          { icon: 'call', label: '024 - Teléfono de la Esperanza' },
          { icon: 'call', label: '112 - Emergencias' },
        ].map((resource, idx) => (
          <TouchableOpacity key={idx} style={styles.resourceItem}>
            <Ionicons name={resource.icon as any} size={20} color={COLORS.primary} />
            <Text style={styles.resourceText}>{resource.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Back to Chat */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)/chat')}
      >
        <Text style={styles.backButtonText}>← Volver a Ágora</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    ...TYPO.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  cardMessage: {
    ...TYPO.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  stepsContainer: {
    marginTop: SPACING.lg,
  },
  step: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    color: COLORS.white,
    ...TYPO.h3,
  },
  stepText: {
    flex: 1,
    ...TYPO.body,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resourceText: {
    ...TYPO.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  backButtonText: {
    ...TYPO.h3,
    color: COLORS.white,
  },
  spacer: {
    height: SPACING.xl,
  },
});
