import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking?: boolean;
  onPressStart: () => void;
  onPressStop: () => void;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isSpeaking = false,
  onPressStart,
  onPressStop,
  disabled = false,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  // Animación de pulsación cuando está escuchando
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isListening, pulseAnim]);

  const handlePress = () => {
    if (isListening) {
      onPressStop();
    } else {
      onPressStart();
    }
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isListening && styles.containerActive,
        disabled && styles.containerDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Pulso de fondo */}
      {isListening && (
        <Animated.View
          style={[
            styles.pulse,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
      )}

      {/* Icono del micrófono */}
      <Feather
        name={isListening ? 'mic' : 'mic-off'}
        size={24}
        color={isListening || isSpeaking ? colors.textLight : colors.text}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mossGreen,
    marginLeft: 8,
  },
  containerActive: {
    backgroundColor: colors.mossGreen,
    borderColor: colors.mossGreen,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  pulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mossGreen,
  },
  icon: {
    zIndex: 1,
  },
});
