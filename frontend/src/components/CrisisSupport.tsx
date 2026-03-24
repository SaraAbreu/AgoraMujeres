import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import Feather from '@expo/vector-icons/Feather';
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Immediate Support */}
      {crisisData?.immediate && (
        <View style={styles.immediateCard}>
          <Text style={styles.immediateTitle}>{crisisData.immediate.title}</Text>
          <Text style={styles.immediateMessage}>{crisisData.immediate.message}</Text>
        </View>
      )}

      {/* Recommended Technique */}
      {crisisData?.technique && (
        <View style={styles.techniqueCard}>
          <Text style={styles.techniqueTitle}>{crisisData.technique.title}</Text>
          <Text style={styles.techniqueMessage}>{crisisData.technique.message}</Text>
          
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

      {/* Other Techniques */}
      {crisisData?.all_techniques && (
        <View style={styles.techniquesSection}>
          <Text style={styles.sectionTitle}>Otras técnicas disponibles</Text>
          {crisisData.all_techniques.map((tech) => (
            <TouchableOpacity
              key={tech.key}
              style={[
                styles.techniqueButton,
                selectedTechnique === tech.title && styles.techniqueButtonActive
              ]}
              onPress={() => setSelectedTechnique(tech.title)}
            >
              <Text style={styles.techniqueButtonText}>{tech.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Emergency Resources */}
      <View style={styles.emergencySection}>
        <Text style={styles.emergencyTitle}>🆘 Recursos de Emergencia</Text>
        <View style={styles.emergencyCard}>
          <Feather name="phone-call" size={20} color={colors.accent} />
          <Text style={styles.emergencyText}>024 - Teléfono de la Esperanza</Text>
        </View>
        <View style={styles.emergencyCard}>
          <Feather name="phone-call" size={20} color={colors.accent} />
          <Text style={styles.emergencyText}>112 - Emergencias</Text>
        </View>
      </View>

      {/* Back to Chat */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)/chat')}
      >
        <Text style={styles.backButtonText}>Volver a Ágora</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#80704f',
    padding: 20,
  },
  immediateCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  immediateTitle: {
    fontSize: 18,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: 10,
  },
  immediateMessage: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    lineHeight: 24,
  },
  techniqueCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  techniqueTitle: {
    fontSize: 18,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.primary,
    marginBottom: 10,
  },
  techniqueMessage: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    marginBottom: 15,
    lineHeight: 22,
  },
  stepsContainer: {
    marginTop: 15,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: colors.background,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    lineHeight: 22,
  },
  techniquesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: 12,
  },
  techniqueButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  techniqueButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  techniqueButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
  },
  emergencySection: {
    backgroundColor: '#fee8e8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
    color: '#cc0000',
    marginBottom: 12,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  emergencyText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
    marginLeft: 12,
  },
  backButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  spacer: {
    height: 40,
  },
});
