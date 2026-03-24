import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Forest Background - Serene environment with water, lotus flowers, and forest
 * Creates a peaceful sanctuary feeling for the chat experience
 */
export function ForestBackground() {
  return (
    <View style={styles.container}>
      {/* Forest Green Gradient Background */}
      <View style={styles.forestGradient} />
      
      {/* Water Layer with subtle shimmer effect */}
      <View style={styles.waterLayer} />
      
      {/* Lotus flowers scattered (simplified emoji version for cross-platform) */}
      <View style={[styles.floralElement, styles.lotus1]}>
        <View style={styles.lotusWrapper}>
          <View style={styles.lilyPad} />
          <View style={styles.flower}>🌸</View>
        </View>
      </View>
      
      <View style={[styles.floralElement, styles.lotus2]}>
        <View style={styles.lotusWrapper}>
          <View style={styles.lilyPad} />
          <View style={styles.flower}>🌸</View>
        </View>
      </View>
      
      <View style={[styles.floralElement, styles.lotus3]}>
        <View style={styles.lotusWrapper}>
          <View style={styles.lilyPad} />
          <View style={styles.flower}>🌷</View>
        </View>
      </View>

      {/* Rocks on the sides */}
      <View style={[styles.rock, styles.rockLeft]}>🪨</View>
      <View style={[styles.rock, styles.rockRight]}>🪨</View>

      {/* Semi-transparent overlay for text readability */}
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  
  // Forest background with warm green gradient
  forestGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#4a7c59', // Deep forest green
    // Gradient from forest colors
    backgroundImage: 'linear-gradient(135deg, #3d6b4f 0%, #5a8a6f 50%, #6a9d7d 100%)',
  },

  // Water layer - subtle blue-green
  waterLayer: {
    position: 'absolute',
    width: '100%',
    height: '65%',
    bottom: 0,
    backgroundColor: '#4a9b8e', // Teal water
    opacity: 0.7,
    backgroundImage: 'linear-gradient(180deg, rgba(74,155,142,0.5) 0%, rgba(54,135,122,0.8) 100%)',
  },

  // Floral elements positioning
  floralElement: {
    position: 'absolute',
    pointerEvents: 'none',
  },

  lotus1: {
    right: '10%',
    bottom: '20%',
    opacity: 0.7,
  },

  lotus2: {
    left: '15%',
    bottom: '35%',
    opacity: 0.5,
  },

  lotus3: {
    right: '25%',
    bottom: '45%',
    opacity: 0.6,
  },

  lotusWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  lilyPad: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7db88f',
    opacity: 0.4,
    position: 'absolute',
  },

  flower: {
    fontSize: 48,
    zIndex: 1,
  },

  // Rocks
  rock: {
    position: 'absolute',
    fontSize: 60,
    pointerEvents: 'none',
    opacity: 0.6,
  },

  rockLeft: {
    left: '5%',
    bottom: '30%',
  },

  rockRight: {
    right: '8%',
    bottom: '25%',
  },

  // Semi-transparent overlay for readability
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Opaque overlay - adjust 0.25 for desired opacity
    pointerEvents: 'none',
  },
});
