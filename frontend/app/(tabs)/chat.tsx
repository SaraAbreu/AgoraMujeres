import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { 
  Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, 
  Platform, FlatList, StyleSheet, ActivityIndicator 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sendChatMessage } from '../../src/services/api';
import { useUserStore } from '../../src/store/useStore';

const COLORS = {
  softGreenBG: '#F8FBF8',
  userBubble: '#4A664D',
  assistantBubble: '#FFFFFF',
  textMain: '#2D3436',
  white: '#FFFFFF',
};

type Message = {
  content: string;
  role: 'user' | 'assistant';
};

// Componente de Burbuja optimizado
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const handleSpeak = (content: string) => {
    Speech.speak(content, { language: 'es-ES', rate: 0.9 });
  };

  return (
    <View style={[styles.bubbleWrapper, isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
          {message.content}
        </Text>
        {!isUser && (
          <TouchableOpacity onPress={() => handleSpeak(message.content)} style={styles.speakerIcon}>
            <Ionicons name="volume-high-outline" size={16} color="#4A664D" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // SOLUCIÓN STORE: Usamos deviceId y userData (donde suele estar el premium)
  const { deviceId, userData } = useUserStore();
  const isPremium = userData?.is_premium || false; 

  const [showPaywall, setShowPaywall] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll al final
  const scrollToBottom = (animated = true) => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated }), 100);
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  // Inicialización: Saludo de Ágora
  useEffect(() => {
    if (!deviceId) return;
    const initChat = async () => {
      try {
        // Enviamos un saludo inicial para despertar a la IA
        const res = await sendChatMessage([{ role: 'user', content: "Hola Ágora" }], deviceId);
        setConversationId(res.conversation_id);
        setMessages([{ role: 'assistant', content: res.response }]);
      } catch (err) {
        console.log('Error init chat:', err);
      }
    };
    if (messages.length === 0) initChat();
  }, [deviceId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !deviceId || isSending) return;

    // Límite para usuarios gratuitos
    if (messageCount >= 5 && !isPremium) {
      setShowPaywall(true);
      return;
    }

    const userMsg: Message = { content: trimmed, role: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      // ✅ IMPORTANTE: Enviamos un array de mensajes con el mensaje del usuario
      const res = await sendChatMessage([{ role: 'user', content: trimmed }], deviceId, conversationId);
      
      if (res.conversation_id) setConversationId(res.conversation_id);
      setMessages(prev => [...prev, { content: res.response, role: 'assistant' }]);
      setMessageCount(prev => prev + 1);
    } catch (err) {
      setMessages(prev => [...prev, { content: "Lo siento, mi conexión se ha debilitado. ¿Podemos intentar de nuevo?", role: 'assistant' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: COLORS.softGreenBG }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Ágora</Text>
        <TouchableOpacity onPress={() => setMessages([])}>
          <Ionicons name="trash-outline" size={20} color="#4A664D" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      {/* INPUT BAR: Flota sobre el tab bar sin solaparse */}
      <View style={[styles.inputContainer, { marginBottom: insets.bottom + 10 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Habla con Ágora..."
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!input.trim() || isSending) && { opacity: 0.5 }]} 
          onPress={handleSend}
          disabled={!input.trim() || isSending}
        >
          {isSending ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="send" size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {/* PAYWALL SIMPLE */}
      <Modal visible={showPaywall} transparent animationType="fade">
        <View style={styles.modalBG}>
          <View style={styles.modalContent}>
            <Ionicons name="star" size={40} color="#FFD700" />
            <Text style={styles.modalTitle}>Has completado tus mensajes de hoy</Text>
            <Text style={styles.modalText}>Para seguir charlando sin límites y apoyar este refugio, suscríbete a Ágora Premium.</Text>
            <TouchableOpacity style={styles.premiumBtn} onPress={() => setShowPaywall(false)}>
              <Text style={styles.premiumBtnText}>Ver Planes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EAEAE0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#4A664D' },
  bubbleWrapper: { flexDirection: 'row', marginBottom: 12 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 18 },
  bubbleUser: { backgroundColor: '#4A664D', borderBottomRightRadius: 2 },
  bubbleAssistant: { backgroundColor: '#FFF', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#EEE' },
  bubbleTextUser: { color: '#FFF', fontSize: 15 },
  bubbleTextAssistant: { color: '#333', fontSize: 15 },
  speakerIcon: { marginTop: 5, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 15, padding: 8, borderRadius: 25, elevation: 5, shadowOpacity: 0.1, shadowRadius: 5 },
  input: { flex: 1, paddingHorizontal: 15, maxHeight: 80, fontSize: 15 },
  sendBtn: { backgroundColor: '#4A664D', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalBG: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', padding: 25, borderRadius: 25, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 15 },
  modalText: { textAlign: 'center', color: '#666', marginVertical: 15 },
  premiumBtn: { backgroundColor: '#4A664D', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20 },
  premiumBtnText: { color: '#FFF', fontWeight: 'bold' }
});