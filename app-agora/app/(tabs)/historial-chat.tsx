import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    Alert,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDeviceIdFromToken, getConversations } from '../../services/api';
import api from '../../services/api';

const COLORS = {
    background:  '#F5F0E8',
    primary:     '#8B5A2B',
    gold:        '#C5A059',
    border:      '#E0D5C5',
    placeholder: '#B0A090',
    card:        '#FFFFFF',
    text:        '#4A3728',
    subtle:      '#A09080',
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Conversation {
    id: string;
    title: string;
    created_at: string;
    updated_at?: string;
    message_count?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    } catch { return ''; }
}

// ─── Componente de cada conversación ─────────────────────────────────────────

interface ConvCardProps {
    item: Conversation;
    onOpen: (id: string, title: string) => void;
    onDelete: (id: string) => void;
}

const ConvCard = ({ item, onOpen, onDelete }: ConvCardProps) => (
    <TouchableOpacity
        style={styles.card}
        onPress={() => onOpen(item.id, item.title)}
        activeOpacity={0.75}
    >
        <View style={styles.cardIcon}>
            <Text style={styles.cardEmoji}>🌿</Text>
        </View>
        <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Conversación'}</Text>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Ionicons name="trash-outline" size={18} color={COLORS.placeholder} />
        </TouchableOpacity>
    </TouchableOpacity>
);

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ChatHistoryScreen() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading]             = useState(true);
    const [deviceId, setDeviceId]           = useState<string | null>(null);
    const [error, setError]                 = useState<string | null>(null);

    const loadConversations = useCallback(async (id: string) => {
        try {
            setError(null);
            const res = await api.get(`/chat/${id}/conversations`, { params: { limit: 30 } });
            const data = res.data;
            setConversations(data.conversations ?? data ?? []);
        } catch (e: any) {
            setError('No se pudieron cargar las conversaciones.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        (async () => {
            const id = await getDeviceIdFromToken();
            if (!id) { setError('Sesión no encontrada.'); setLoading(false); return; }
            setDeviceId(id);
            await loadConversations(id);
        })();
    }, []);

    const handleOpen = (conversationId: string, title: string) => {
        router.push({
            pathname: '/(tabs)/chat' as any,
            params: { conversationId },
        });
    };

    const doDelete = async (conversationId: string) => {
        if (!deviceId) return;
        try {
            await api.delete(`/chat/${deviceId}/conversation/${conversationId}`);
            setConversations(prev => prev.filter(c => c.id !== conversationId));
        } catch {
            if (Platform.OS === 'web') {
                window.alert('No se pudo borrar la conversación.');
            } else {
                Alert.alert('Error', 'No se pudo borrar la conversación.');
            }
        }
    };

    const handleDelete = (conversationId: string) => {
        if (Platform.OS === 'web') {
            // Alert.alert no ejecuta callbacks en Expo Web — usamos window.confirm
            const confirmed = window.confirm('¿Seguro que quieres eliminar esta conversación?');
            if (confirmed) doDelete(conversationId);
            return;
        }
        Alert.alert(
            'Borrar conversación',
            '¿Seguro que quieres eliminar esta conversación?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Borrar', style: 'destructive', onPress: () => doDelete(conversationId) },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Historial de chat</Text>
                    <Text style={styles.headerSubtitle}>Tus conversaciones con Ágora</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            {/* Contenido */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando conversaciones…</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorEmoji}>🌿</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => deviceId && loadConversations(deviceId)}
                    >
                        <Text style={styles.retryText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyEmoji}>🌿</Text>
                    <Text style={styles.emptyTitle}>Aún no hay conversaciones</Text>
                    <Text style={styles.emptyText}>Cuando hables con Ágora, tus conversaciones aparecerán aquí.</Text>
                    <TouchableOpacity style={styles.startBtn} onPress={() => router.back()}>
                        <Text style={styles.startBtnText}>Empezar a hablar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ConvCard
                            item={item}
                            onOpen={handleOpen}
                            onDelete={handleDelete}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea:      { flex: 1, backgroundColor: COLORS.background },
    centered:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
    loadingText:   { color: COLORS.primary, fontSize: 15 },

    header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn:       { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    headerCenter:  { alignItems: 'center' },
    headerTitle:   { fontSize: 17, fontWeight: '700', color: COLORS.primary },
    headerSubtitle:{ fontSize: 12, color: COLORS.gold },

    listContent:   { padding: 16 },
    separator:     { height: 8 },

    card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    cardIcon:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDE5D8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    cardEmoji:     { fontSize: 18 },
    cardBody:      { flex: 1, gap: 3 },
    cardTitle:     { fontSize: 15, fontWeight: '600', color: COLORS.text },
    cardDate:      { fontSize: 12, color: COLORS.subtle },
    deleteBtn:     { padding: 6 },

    errorEmoji:    { fontSize: 40, marginBottom: 4 },
    errorText:     { color: COLORS.primary, fontSize: 15, textAlign: 'center' },
    retryBtn:      { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    retryText:     { color: COLORS.primary, fontSize: 14, fontWeight: '600' },

    emptyEmoji:    { fontSize: 48, marginBottom: 8 },
    emptyTitle:    { fontSize: 18, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
    emptyText:     { fontSize: 14, color: '#6B5744', textAlign: 'center', lineHeight: 21 },
    startBtn:      { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: COLORS.primary },
    startBtnText:  { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});