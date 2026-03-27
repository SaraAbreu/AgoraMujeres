import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';



const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Un espacio solo para ti',
    text: 'Ágora es un lugar seguro donde puedes expresarte sin juicio.',
  },
  {
    title: 'No estás sola',
    text: 'Sabemos lo que es convivir con dolor crónico. Aquí te entendemos.',
  },
  {
    title: 'Tu ritmo importa',
    text: 'Puedes escribir, hablar o simplemente estar. Todo está bien.',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  const next = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{slides[index].title}</Text>
          <Text style={styles.text}>{slides[index].text}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.activeDot]} />
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={next}>
            <Text style={styles.buttonText}>
              {index === slides.length - 1 ? 'Entrar' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },

  content: {
    marginTop: 120,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF8F1',
    marginBottom: 16,
  },

  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#E9DED0',
  },

  footer: {
    paddingBottom: 60,
    alignItems: 'center',
  },

  dots: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A08C78',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#FFF8F1',
  },

  button: {
    backgroundColor: '#6B3F25',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 20,
  },

  buttonText: {
    color: '#FFF8F1',
    fontWeight: '600',
    fontSize: 16,
  },
});