import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, Platform } from 'react-native';
import { colors, spacing } from '../theme/colors';

interface OnboardingProps {
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const SCREENS = [
  {
    type: 'complete',
    title: '¡Hola soy Ágora!',
    subtitle: 'Tu acompañante en el cuidado de tu salud',
    sectionTitle: 'Te ayudaré a:',
    features: [
      'Registrar y entender tu ciclo menstrual',
      'Monitorear tus síntomas y patrones de salud',
      'Recibir recomendaciones personalizadas',
      'Conectar con información sobre salud menstrual',
      'Acceder a recursos y consejos útiles',
      'Tomar decisiones informadas sobre tu bienestar',
    ],
    disclaimer: 'Ágora es una herramienta de seguimiento y educación. No reemplaza la consulta médica profesional. Si tienes inquietudes de salud, consulta con tu médico.',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const screen = SCREENS[0];

  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo - Arriba */}
        <Image 
          source={require('../../assets/images/agora-logo.png')}
          style={styles.welcomeImage}
        />
        
        {/* Título Principal */}
        <Text style={styles.title}>{screen.title}</Text>
        
        {/* Subtítulo */}
        <Text style={styles.subtitle}>{screen.subtitle}</Text>
        
        {/* Sección de Características */}
        <Text style={styles.sectionTitle}>{screen.sectionTitle}</Text>
        
        <View style={styles.featuresList}>
          {screen.features && screen.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimer}>{screen.disclaimer}</Text>
        </View>
      </ScrollView>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.nextButton]}
          onPress={onComplete}
        >
          <Text style={styles.nextButtonText}>Empezar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#80704f',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: isWeb ? spacing.xl : spacing.lg,
    paddingVertical: isWeb ? spacing.lg : spacing.lg,
    justifyContent: 'center',
  },
  
  // Pantalla 1: Bienvenida
  welcomeImage: {
    width: isWeb ? Math.min(width - spacing.lg * 2, 400) : '100%',
    height: isWeb ? 350 : 320,
    borderRadius: 20,
    marginBottom: spacing.xl,
    marginHorizontal: isWeb ? 'auto' : 0,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  
  // Pantalla 2: Características
  featuresList: {
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  featureBullet: {
    fontSize: 28,
    color: colors.accent,
    marginRight: spacing.md,
    lineHeight: 32,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: isWeb ? 18 : 16,
    fontFamily: 'Nunito_400Regular',
    color: 'white',
    lineHeight: 28,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  disclaimerBox: {
    backgroundColor: colors.accent + '30',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    marginTop: spacing.xl,
  },
  disclaimer: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Común
  title: {
    fontSize: isWeb ? 36 : 32,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.warmBrownLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: isWeb ? 44 : 40,
  },
  subtitle: {
    fontSize: isWeb ? 18 : 16,
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    opacity: 0.95,
  },
  sectionTitle: {
    fontSize: isWeb ? 22 : 20,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.warmBrownLight,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  description: {
    fontSize: isWeb ? 18 : 16,
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnPrimary,
    textAlign: 'center',
    lineHeight: 32,
    opacity: 0.95,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: colors.warmBrownDark,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: 'white',
  },
});
