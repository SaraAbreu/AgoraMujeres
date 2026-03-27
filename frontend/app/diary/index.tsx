import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDiaryEntries, type DiaryEntry } from '../../src/services/api';
import { useStore } from '../../src/store/useStore';
import { colors, textStyles, sp } from '../../src/theme';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DiaryListScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deviceId } = useStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList<DiaryEntry>>(null);

  // Recarga la lista cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      if (!deviceId) {
        console.log('[Diary] Sin deviceId, no se recarga');
        return;
      }
      console.log('[Diary] Recargando entradas para deviceId:', deviceId);
      setLoading(true);
      getDiaryEntries(deviceId, 50)
        .then((data) => {
          console.log('[Diary] Entradas recibidas:', data);
          setEntries(data);
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 300);
        })
        .catch((err) => {
          console.error('[Diary] Error al obtener entradas:', err);
        })
        .finally(() => setLoading(false));
    }, [deviceId])
  );

  const renderItem = ({ item }: { item: DiaryEntry }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.headerRow}>
        <Ionicons name="book-outline" size={18} color={colors.primary} />
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.text}>{item.texto || t('noText')}</Text>
      <View style={styles.emotionsRow}>
        {Object.entries(item.emotional_state || {}).map(([k, v]) => (
          <Text key={k} style={styles.emotion}>{k}: {v}</Text>
        ))}
      </View>
      {item.physical_state && (
        <View style={styles.physicalRow}>
          <Text style={styles.physical}>{t('nivel_dolor')}: {item.physical_state.nivel_dolor}</Text>
          <Text style={styles.physical}>{t('energia')}: {item.physical_state.energia}</Text>
          <Text style={styles.physical}>{t('sensibilidad')}: {item.physical_state.sensibilidad}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('diary')}</Text>
        <TouchableOpacity onPress={() => router.push('/diary/new')}>
          <Ionicons name="add-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={entries}
          keyExtractor={e => e.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.empty}>{t('noEntries')}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp.screenX,
    paddingVertical: sp.sm,
  },
  headerTitle: { ...textStyles.h1, color: colors.textPrimary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: sp.screenX,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { color: colors.textMuted, fontSize: 13 },
  text: { ...textStyles.body, color: colors.textPrimary, marginVertical: 8 },
  emotionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotion: { color: colors.accent, fontSize: 13, marginRight: 8 },
  physicalRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  physical: { color: colors.primaryDark, fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
