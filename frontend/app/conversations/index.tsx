import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../../src/components/ui';
import { EmptyState } from '../../src/components/ui';
import { useUserStore } from '../../src/store/useStore';
import {
  getConversations, deleteConversation, type Conversation,
} from '../../src/services/api';
import { colors, textStyles, sp, radius, fonts } from '../../src/theme';

export default function ConversationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useUserStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    if (!deviceId) return;
    try {
      const res = await getConversations(deviceId);
      setConversations(res);
    } catch {}
    setLoading(false);
  }, [deviceId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (id: string) => {
    Alert.alert(t('deleteConversation'), t('deleteConversationConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive',
        onPress: async () => {
          if (!deviceId) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          try {
            await deleteConversation(deviceId, id);
            setConversations((prev) => prev.filter((c) => c.id !== id));
          } catch {}
        },
      },
    ]);
  };

  const handleOpen = (id: string) => {
    // Navigate to main chat, passing conversation id
    router.push({ pathname: '/(tabs)/chat', params: { conversationId: id } });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity onPress={() => handleOpen(item.id)} activeOpacity={0.7}>
      <GlassCard style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || t('conversation')}
            </Text>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={12}>
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>"Mis conversaciones"</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Sin conversaciones"
          message="Tus conversaciones con Ágora aparecerán aquí"
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: sp.screenX, paddingVertical: sp.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...textStyles.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: sp.screenX, paddingBottom: 40 },

  card: { marginBottom: sp.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  cardIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo:    { flex: 1 },
  cardTitle:   { ...textStyles.subtitleSm, color: colors.textPrimary },
  cardDate:    { ...textStyles.bodySm, color: colors.textMuted },
  cardPreview: { ...textStyles.bodySm, color: colors.textSecondary, marginTop: sp.xs },
  cardMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: sp.sm,
  },
  cardCount: { ...textStyles.bodySm, color: colors.textMuted },
});
