import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashAgoraAnimated() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/Prototiposplash.png')}
        style={styles.bg}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    backgroundColor: '#6B6A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bg: {
    position: 'absolute',
    width,
    height,
    resizeMode: 'cover',
  },
});
