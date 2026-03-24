import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPO } from '../theme';

interface OnboardingProps {
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const SCREENS = [
  {
    title: '✨ Hola, soy Ágora',
    message: 'Tu compañera en el cuidado de tu salud menstrual',
    emoji: '🌸',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const screen = SCREENS[0];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Emoji */}
        <Text style={styles.mainEmoji}>{screen.emoji}</Text>
        
        {/* Title */}
        <Text style={styles.title}>{screen.title}</Text>
        
        {/* Message */}
        <Text style={styles.message}>{screen.message}</Text>

        {/* Benefits Section - Simple, 3 items max */}
        <View style={styles.benefitsContainer}>
          {[
            '📔 Registra tu ciclo y síntomas',
            '💭 Chatea con Ágora',
            '📈 Descubre patrones de tu salud',
          ].map((benefit, idx) => (
            <Text key={idx} style={styles.benefit}>
              {benefit}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={onComplete}
        >
          <Text style={styles.startButtonText}>Empezar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  mainEmoji: {
    fontSize: 80,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },

  title: {
    ...TYPO.h1,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  message: {
    ...TYPO.body,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 28,
  },

  benefitsContainer: {
    marginVertical: SPACING.xl,
    width: '100%',
    gap: SPACING.lg,
  },

  benefit: {
    ...TYPO.body,
    color: COLORS.white,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    lineHeight: 26,
  },

  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },

  startButtonText: {
    ...TYPO.h3,
    color: COLORS.white,
  },
});
