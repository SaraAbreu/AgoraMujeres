import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    sendChatMessage,
    getChatHistory,
    clearChatHistory,
    getDeviceIdFromToken,
    ChatMessage,
} from '../../services/api';

// ─── Constantes de estilo ─────────────────────────────────────────────────────

const COLORS = {
    background:      '#F5F0E8',
    primary:         '#8B5A2B',
    gold:            '#C5A059',
    userBubble:      '#8B5A2B',
    assistantBubble: '#FFFFFF',
    userText:        '#FFFFFF',
    assistantText:   '#4A3728',
    inputBg:         '#FFFFFF',
    border:          '#E0D5C5',
    placeholder:     '#B0A090',
    sendBtn:         '#8B5A2B',
    sendBtnDisabled: '#C5B8A8',
    typing:          '#C5A059',
    timestamp:       '#A09080',
};

// ─── Banner de suscripción ────────────────────────────────────────────────────

const SubscriptionBanner = () => (
    <View style={styles.subBanner}>
        <Text style={styles.subBannerEmoji}>✨</Text>
        <View style={styles.subBannerBody}>
            <Text style={styles.subBannerTitle}>Has llegado al límite gratuito</Text>
            <Text style={styles.subBannerText}>
                Activa el Plan Áurea para seguir hablando con Ágora sin límites.
            </Text>
        </View>
        <TouchableOpacity
            style={styles.subBannerBtn}
            onPress={() => router.push('/plan' as any)}
            activeOpacity={0.85}
        >
            <Text style={styles.subBannerBtnText}>Ver planes</Text>
        </TouchableOpacity>
    </View>
);

// ─── Componente burbuja ───────────────────────────────────────────────────────

interface BubbleProps {
    message: ChatMessage;
}

const MessageBubble = React.memo(({ message }: BubbleProps) => {
    const isUser = message.role === 'user';
    return (
        <View style={[styles.bubbleRow, isUser ? styles.rowUser : styles.rowAssistant]}>
            {!isUser && (
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarEmoji}>🌿</Text>
                </View>
            )}
            <View style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleAssistant,
            ]}>
                <Text style={[
                    styles.bubbleText,
                    isUser ? styles.textUser : styles.textAssistant,
                ]}>
                    {message.content}
                </Text>
                {message.created_at && (
                    <Text style={styles.timestamp}>
                        {formatTime(message.created_at)}
                    </Text>
                )}
            </View>
        </View>
    );
});

// ─── Indicador de escritura ───────────────────────────────────────────────────

const TypingIndicator = () => (
    <View style={[styles.bubbleRow, styles.rowAssistant]}>
        <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🌿</Text>
        </View>
        <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
            <Text style={styles.typingText}>Ágora está escribiendo…</Text>
        </View>
    </View>
);

// ─── Modal de confirmación para Limpiar ──────────────────────────────────────

interface ClearConfirmModalProps {
    visible: boolean;
    isClearing: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

const ClearConfirmModal = ({ visible, isClearing, onCancel, onConfirm }: ClearConfirmModalProps) => (
    <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onCancel}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <Text style={styles.modalEmoji}>🌿</Text>
                <Text style={styles.modalTitle}>Borrar conversación</Text>
                <Text style={styles.modalBody}>
                    Esta acción eliminará todos los mensajes de esta conversación.
                    No se puede deshacer.
                </Text>
                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={[styles.modalBtn, styles.modalBtnCancel]}
                        onPress={onCancel}
                        disabled={isClearing}
                    >
                        <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalBtn, styles.modalBtnConfirm, isClearing && styles.modalBtnDisabled]}
                        onPress={onConfirm}
                        disabled={isClearing}
                    >
                        {isClearing
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={styles.modalBtnConfirmText}>Sí, borrar</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ChatScreen() {
    const [messages, setMessages]               = useState<ChatMessage[]>([]);
    const [inputText, setInputText]             = useState('');
    const [isLoading, setIsLoading]             = useState(false);
    const [isInitializing, setIsInitializing]   = useState(true);
    const [deviceId, setDeviceId]               = useState<string | null>(null);
    const [conversationId, setConversationId]   = useState<string | undefined>(undefined);
    const [errorMsg, setErrorMsg]               = useState<string | null>(null);
    const [showClearModal, setShowClearModal]   = useState(false);
    const [isClearing, setIsClearing]           = useState(false);
    const [showSubBanner, setShowSubBanner]     = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const params = useLocalSearchParams();

    // ── Inicialización ────────────────────────────────────────────────────────
    useEffect(() => {
        const startUp = async () => {
            const id = await getDeviceIdFromToken();
            if (!id) {
                setErrorMsg('Sesión no encontrada.');
                setIsInitializing(false);
                return;
            }
            setDeviceId(id);

            if (params.conversationId) {
                setConversationId(params.conversationId as string);
            }

            await initChat(id, params.conversationId as string | undefined);
        };
        startUp();
    }, [params.conversationId]);

    const initChat = async (id: string, forcedConversationId?: string) => {
        try {
            const history = await getChatHistory(id, 50);
            if (history.length > 0) {
                setMessages(history);
                if (!forcedConversationId) {
                    const lastWithConv = [...history].reverse().find(m => m.conversation_id);
                    if (lastWithConv?.conversation_id) {
                        setConversationId(lastWithConv.conversation_id);
                    }
                }
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error('Error inicializando chat:', err);
            setErrorMsg('No se pudo cargar el historial.');
        } finally {
            setIsInitializing(false);
        }
    };

    // ── Scroll al final ───────────────────────────────────────────────────────
    const scrollToEnd = useCallback(() => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, []);

    useEffect(() => {
        if (messages.length > 0) scrollToEnd();
    }, [messages, isLoading]);

    // ── Enviar mensaje ────────────────────────────────────────────────────────
    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || isLoading || !deviceId) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);
        setErrorMsg(null);

        try {
            const result = await sendChatMessage(deviceId, text, conversationId);

            if (result.requires_subscription) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.response,
                    created_at: new Date().toISOString(),
                }]);
                setShowSubBanner(true);
                return;
            }

            if (result.conversation_id) {
                setConversationId(result.conversation_id);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.response,
                created_at: new Date().toISOString(),
                conversation_id: result.conversation_id,
            }]);
        } catch (err: any) {
            console.error('Error enviando mensaje:', err);
            setMessages(prev => prev.slice(0, -1));
            setInputText(text);
            setErrorMsg('No se pudo conectar con Ágora. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Limpiar historial ─────────────────────────────────────────────────────
    const handleClear = () => setShowClearModal(true);

    const handleConfirmClear = async () => {
        if (!deviceId) return;
        setIsClearing(true);
        try {
            await clearChatHistory(deviceId);
            setMessages([]);
            setConversationId(undefined);
            setShowClearModal(false);
        } catch {
            setErrorMsg('Error al borrar el historial.');
            setShowClearModal(false);
        } finally {
            setIsClearing(false);
        }
    };

    // ── Nuevo chat (limpia pantalla, no borra servidor) ───────────────────────
    const handleNewChat = () => {
        setMessages([]);
        setConversationId(undefined);
        setErrorMsg(null);
        setInputText('');
    };

    // ── Ir al historial de chat ───────────────────────────────────────────────
    const handleOpenHistory = () => {
        router.push('/(tabs)/historial-chat' as any);
    };

    if (isInitializing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Conectando con Ágora…</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ClearConfirmModal
                visible={showClearModal}
                isClearing={isClearing}
                onCancel={() => setShowClearModal(false)}
                onConfirm={handleConfirmClear}
            />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerEmoji}>🌿</Text>
                    <View>
                        <Text style={styles.headerTitle}>Ágora</Text>
                        <Text style={styles.headerSubtitle}>Tu compañera de bienestar</Text>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    {/* Historial */}
                    <TouchableOpacity
                        onPress={handleOpenHistory}
                        style={styles.headerActionBtn}
                        accessibilityLabel="Ver historial de conversaciones"
                    >
                        <Ionicons name="chatbubbles-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.headerActionLabel}>Historial</Text>
                    </TouchableOpacity>
                    {/* Nuevo chat */}
                    <TouchableOpacity
                        onPress={handleNewChat}
                        style={styles.headerActionBtn}
                        accessibilityLabel="Nueva conversación"
                    >
                        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.headerActionLabel}>Nuevo</Text>
                    </TouchableOpacity>
                    {/* Limpiar */}
                    <TouchableOpacity
                        onPress={handleClear}
                        style={[styles.headerActionBtn, messages.length === 0 && styles.headerActionBtnDisabled]}
                        accessibilityLabel="Borrar conversación"
                        disabled={messages.length === 0}
                    >
                        <Ionicons name="trash-outline" size={20} color={messages.length === 0 ? COLORS.placeholder : '#B91C1C'} />
                        <Text style={[styles.headerActionLabel, messages.length === 0 && styles.headerActionLabelDisabled]}>Limpiar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 110}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => <MessageBubble message={item} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<WelcomeMessage />}
                    ListFooterComponent={isLoading ? <TypingIndicator /> : null}
                    showsVerticalScrollIndicator={false}
                />

                {showSubBanner && <SubscriptionBanner />}

                {errorMsg && (
                    <View style={styles.errorBar}>
                        <Text style={styles.errorText}>{errorMsg}</Text>
                        <TouchableOpacity onPress={() => setErrorMsg(null)}>
                            <Text style={styles.errorClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Escribe a Ágora…"
                        placeholderTextColor={COLORS.placeholder}
                        multiline
                        maxLength={1000}
                        editable={!isLoading}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isLoading}
                    >
                        {isLoading
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={styles.sendIcon}>↑</Text>
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Componente Bienvenida ────────────────────────────────────────────────────

const WelcomeMessage = () => (
    <View style={styles.welcome}>
        <Text style={styles.welcomeEmoji}>🌿</Text>
        <Text style={styles.welcomeTitle}>Hola, soy Ágora</Text>
        <Text style={styles.welcomeText}>
            Estoy aquí para acompañarte en tu bienestar. Puedes contarme
            cómo te sientes, preguntarme sobre tus síntomas o simplemente hablar.
        </Text>
        <Text style={styles.welcomeHint}>¿Cómo estás hoy?</Text>
    </View>
);

function formatTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea:          { flex: 1, backgroundColor: COLORS.background },
    flex:              { flex: 1 },
    centered:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, gap: 12 },
    loadingText:       { color: COLORS.primary, fontSize: 15 },

    header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerEmoji:       { fontSize: 28 },
    headerTitle:       { fontSize: 18, fontWeight: '700', color: COLORS.primary },
    headerSubtitle:    { fontSize: 12, color: COLORS.gold },
    headerActions:     { flexDirection: 'row', alignItems: 'center', gap: 8 },

    iconBtn:           { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    clearBtn:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
    clearBtnText:      { fontSize: 13, color: COLORS.primary },

    headerActionBtn:         { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4, gap: 2 },
    headerActionBtnDisabled: { opacity: 0.35 },
    headerActionLabel:       { fontSize: 10, color: COLORS.primary, fontWeight: '500' },
    headerActionLabelDisabled:{ fontSize: 10, color: COLORS.placeholder, fontWeight: '500' },

    listContent:       { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
    bubbleRow:         { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', maxWidth: '100%' },
    rowUser:           { justifyContent: 'flex-end' },
    rowAssistant:      { justifyContent: 'flex-start' },
    avatarContainer:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDE5D8', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2, flexShrink: 0 },
    avatarEmoji:       { fontSize: 16 },
    bubble:            { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
    bubbleUser:        { backgroundColor: COLORS.userBubble, borderBottomRightRadius: 4 },
    bubbleAssistant:   { backgroundColor: COLORS.assistantBubble, borderBottomLeftRadius: 4 },
    bubbleText:        { fontSize: 15, lineHeight: 22 },
    textUser:          { color: COLORS.userText },
    textAssistant:     { color: COLORS.assistantText },
    timestamp:         { fontSize: 10, color: COLORS.timestamp, marginTop: 4, textAlign: 'right' },
    typingBubble:      { paddingVertical: 12, paddingHorizontal: 16 },
    typingText:        { color: COLORS.typing, fontSize: 14, fontStyle: 'italic' },

    errorBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF0F0', borderTopWidth: 1, borderTopColor: '#FECACA', paddingHorizontal: 16, paddingVertical: 8 },
    errorText:         { color: '#B91C1C', fontSize: 13, flex: 1 },
    errorClose:        { color: '#B91C1C', fontSize: 16, paddingLeft: 8 },

    inputRow:          { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8, marginBottom: 110 },
    input:             { flex: 1, backgroundColor: COLORS.inputBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#3A2E26', maxHeight: 120, minHeight: 44 },
    sendBtn:           { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.sendBtn, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sendBtnDisabled:   { backgroundColor: COLORS.sendBtnDisabled },
    sendIcon:          { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: -1 },

    welcome:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60, gap: 12 },
    welcomeEmoji:      { fontSize: 56, marginBottom: 4 },
    welcomeTitle:      { fontSize: 22, fontWeight: '700', color: COLORS.primary },
    welcomeText:       { fontSize: 15, color: '#6B5744', textAlign: 'center', lineHeight: 23 },
    welcomeHint:       { fontSize: 16, color: COLORS.gold, fontStyle: 'italic', marginTop: 8 },

    subBanner:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FDF8F0', borderTopWidth: 1, borderTopColor: '#E8D5B0', paddingHorizontal: 14, paddingVertical: 12 },
    subBannerEmoji:    { fontSize: 22, flexShrink: 0 },
    subBannerBody:     { flex: 1 },
    subBannerTitle:    { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
    subBannerText:     { fontSize: 12, color: '#6B5744', lineHeight: 17 },
    subBannerBtn:      { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexShrink: 0 },
    subBannerBtnText:  { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

    modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    modalCard:         { backgroundColor: COLORS.background, borderRadius: 24, paddingHorizontal: 28, paddingVertical: 32, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
    modalEmoji:        { fontSize: 40, marginBottom: 12 },
    modalTitle:        { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 10 },
    modalBody:         { fontSize: 14, color: '#6B5744', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
    modalActions:      { flexDirection: 'row', gap: 12, width: '100%' },
    modalBtn:          { flex: 1, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel:    { backgroundColor: '#EDE5D8' },
    modalBtnCancelText:{ color: COLORS.primary, fontSize: 15, fontWeight: '600' },
    modalBtnConfirm:   { backgroundColor: COLORS.primary },
    modalBtnConfirmText:{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    modalBtnDisabled:  { opacity: 0.6 },
});