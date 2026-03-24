import React from 'react';
import { View, ImageBackground, Platform, StyleSheet, Image } from 'react-native';

interface ChatBackgroundProps {
  children: React.ReactNode;
}

const backgroundImage = require('../../assets/images/Copilot_20260319_094455.png');

export function ChatBackground({ children }: ChatBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Background image layer */}
      <Image
        source={backgroundImage}
        style={styles.backgroundImage}
      />
      {/* Content layer */}
      <View style={styles.contentLayer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentLayer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
