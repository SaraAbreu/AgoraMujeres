// ============================================================
//  chat.tsx — CORREGIDO (compatibilidad Android / iOS / Web)
//  BUGS RESUELTOS:
//  [BUG-1] renderMessage lanzaba "Function not implemented."
//  [BUG-2] handleSend definida pero nunca usada (lógica duplicada inline)
//  [BUG-3] scrollToEnd llamado 3× sin guard de null + setTimeout frágil
//  [BUG-9] Import API_BASE no utilizado eliminado
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FlatList as FlatListType, ListRenderItemInfo } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sendChatMessage } from '../../src/services/api';
import { useStore } from '../../src/store/useStore';
import { colors } from '../../src/theme';

// ─── Tipos ───────────────────────────────────────────────────
type Message = {
  content: string;
  role: 'user' | 'assistant';
};

// ─── Componente de burbuja de mensaje ────────────────────────
// [BUG-1 FIX] Implementación real de renderMessage.
// Antes: function renderMessage(...) { throw new Error('Function not implemented.'); }
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────
export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // [BUG-3 FIX] Tipamos el ref correctamente para FlatList de Message
  const flatListRef = useRef<FlatListType<Message>>(null);

  const { deviceId } = useStore();

  // ─── Mensaje de bienvenida al montar ─────────────────────
  useEffect(() => {
    const welcome: Message = {
      role: 'assistant',
      content: t('welcomeMessage', '¡Hola! Soy Ágora. ¿En qué puedo ayudarte hoy?'),
    };
    setMessages([welcome]);
  }, []);

  // ─── Auto-scroll protegido ────────────────────────────────
  // [BUG-3 FIX] Un único punto de scroll, protegido con optional chaining.
  // Usamos InteractionManager / requestAnimationFrame para esperar al layout.
  const scrollToBottom = useCallback((animated = true) => {
    // requestAnimationFrame está disponible en RN (Hermes/JSC/Web)
    requestAnimationFrame(() => {
      try {
        flatListRef.current?.scrollToEnd({ animated });
      } catch {
        // scrollToEnd puede lanzar si la lista está vacía o no montada;
        // ignoramos silenciosamente para no crashear la app.
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // ─── Lógica de envío unificada ────────────────────────────
  // [BUG-2 FIX] handleSend era una función definida pero nunca llamada.
  // La lógica real estaba duplicada inline en el onPress del botón.
  // Ahora hay UNA sola función que el botón usa.
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !deviceId || isSending) return;

    const userMsg: Message = { content: trimmed, role: 'user' };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const history: Message[] = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(history, deviceId, conversationId);

      if (res.conversation_id) setConversationId(res.conversation_id);

      const assistantMsg: Message = { content: res.response, role: 'assistant' };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { content: t('connectionError', 'Error de conexión. Inténtalo de nuevo.'), role: 'assistant' },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [input, deviceId, isSending, messages, conversationId, t]);

  // ─── Render de cada ítem ──────────────────────────────────
  // [BUG-1 FIX] Función real: antes lanzaba new Error('Function not implemented.')
  const renderMessage = useCallback(
    (info: ListRenderItemInfo<Message>) => <MessageBubble message={info.item} />,
    [],
  );

  // ─── UI ───────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg ?? '#FDFAF7' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Cabecera */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary ?? '#7C6AA6'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ágora</Text>
        {/* Placeholder para centrar el título */}
        <View style={styles.backBtn} />
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        // Usamos índice + role como key para garantizar unicidad
        keyExtractor={(item, i) => `${i}-${item.role}`}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        // Mantener scroll al final al añadir items
        onContentSizeChange={() => scrollToBottom(false)}
      />

      {/* Barra de entrada */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: insets.bottom + 12 },
        ]}
      >
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder={t('typeMessage', 'Escribe un mensaje...')}
          placeholderTextColor={colors.textMuted ?? '#999'}
          multiline
          maxLength={1000}
          // Enviar con Enter en web (no en móvil para permitir saltos de línea)
          onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
          blurOnSubmit={Platform.OS === 'web'}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || isSending}
          style={[
            styles.sendBtn,
            (!input.trim() || isSending) && styles.sendBtnDisabled,
          ]}
          accessibilityLabel={t('send', 'Enviar')}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-up" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
// Nota: Todos los estilos usan propiedades compatibles con
// el motor JSC/Hermes de Android (sin 'gap', sin 'inset', etc.)
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E7C3',
    backgroundColor: '#FDFAF7',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#3D3450',
  },
  backBtn: {
    width: 40,
    alignItems: 'center',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  bubbleRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#7C6AA6',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#F0EDE8',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Quicksand_400Regular',
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextAssistant: {
    color: '#3D3450',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E7C3',
    backgroundColor: '#FDFAF7',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8D4CC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontFamily: 'Quicksand_400Regular',
    color: '#3D3450',
    backgroundColor: '#fff',
    // maxHeight limita el crecimiento del multiline en todas las plataformas
    maxHeight: 120,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C6AA6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C4BDD6',
  },
});
