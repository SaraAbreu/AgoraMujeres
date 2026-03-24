import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const SPLASH_IMAGE = require('../../assets/images/splash-prototipo.png');
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

interface SplashScreenProps {
  duration?: number;
}

export function SplashScreen({ duration = 2500 }: SplashScreenProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, router]);

  return (
    <View style={styles.container}>
      <Image
        source={SPLASH_IMAGE}
        style={styles.image}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
});
