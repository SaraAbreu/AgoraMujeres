import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const features = [
    {
      icon: 'calendar-outline',
      title: 'Registrar y entender tu ciclo menstrual',
    },
    {
      icon: 'pulse',
      title: 'Monitorear tus síntomas y patrones de salud',
    },
    {
      icon: 'bulb-outline',
      title: 'Recibir recomendaciones personalizadas',
    },
    {
      icon: 'book-outline',
      title: 'Conectar con información sobre salud menstrual',
    },
    {
      icon: 'library-outline',
      title: 'Acceder a recursos y consejos útiles',
    },
    {
      icon: 'brain',
      title: 'Tomar decisiones informadas sobre tu bienestar',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con ícono */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="woman" size={48} color={colors.mossGreen} />
          </View>
          <Text style={styles.title}>Ágora Mujeres</Text>
          <Text style={styles.subtitle}>Tu refugio emocional</Text>
        </View>

        {/* Descripción */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>¡Hola soy Ágora!</Text>
          <Text style={styles.description}>Tu acompañante en el cuidado de tu salud</Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Te ayudaré a</Text>
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <Ionicons name={feature.icon as any} size={24} color={colors.mossGreen} />
                </View>
                <Text style={styles.featureText}>{feature.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Ágora es una herramienta de seguimiento y educación. No reemplaza la consulta médica profesional. Si tienes inquietudes de salud, consulta con tu médico.
          </Text>
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={onComplete}>
          <Text style={styles.buttonText}>Empezar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Cormorant_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginTop: 4,
  },
  descriptionSection: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  featuresSection: {
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
    flex: 1,
  },
  disclaimerBox: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    width: '100%',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    backgroundColor: colors.mossGreen,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.softWhite,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
});
