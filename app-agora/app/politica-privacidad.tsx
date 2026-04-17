import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import PRIVACIDAD from '../../POLITICA_PRIVACIDAD_Y_OLVIDO.md';

export default function PoliticaPrivacidadScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Política de Privacidad</Text>
      <Text style={styles.text}>{PRIVACIDAD}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  text: { fontSize: 16, color: '#333' },
});
