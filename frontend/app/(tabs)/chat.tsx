import { API_BASE } from '../../src/services/api';
import React, { useState, useRef, useEffect } from 'react';
import type { FlatList as FlatListType } from 'react-native';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sendChatMessage } from '../../src/services/api';
import { useStore } from '../../src/store/useStore';
import { colors } from '../../src/theme';


export interface Message {
  content: string;
  role: 'user' | 'assistant';
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatListType<Message>>(null);
  const { deviceId } = useStore();

  // Mensaje de bienvenida de Ágora
  useEffect(() => {
    setMessages([
      { content: '¡Hola! Soy Ágora, ¿en qué puedo ayudarte hoy?', role: 'assistant' }
    ]);
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginVertical: 4,
          paddingHorizontal: 8,
        }}
      >
        <View
          style={{
            backgroundColor: isUser ? colors.primary : '#F4F4F4',
            borderRadius: 16,
            padding: 10,
            maxWidth: '80%',
            alignSelf: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <Text style={{ color: isUser ? '#fff' : colors.textPrimary }}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{t('chatWithAgora')}</Text>
        <TouchableOpacity onPress={() => router.push('/conversations')}>
          <Ionicons name="chatbubbles-outline" size={20} />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      />
      <View style={{ padding: 8, paddingBottom: insets.bottom + 90 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 }}
            value={input}
            onChangeText={setInput}
            placeholder={t('typeMessage')}
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            onPress={async () => {
              console.log('DeviceId:', deviceId);
              console.log('API_BASE:', API_BASE);
              if (!input.trim()) return;
              const userMsg: Message = { content: input, role: 'user' };
              setMessages(prev => [...prev, userMsg]);
              setInput('');
              setTimeout(() => {
                flatListRef.current?.scrollToEnd?.({ animated: true });
              }, 100);

              // Llamar al backend con historial
              try {
                const history: Message[] = [...messages, userMsg].map(m => ({
                  role: m.role,
                  content: m.content
                }));
                console.log('[CHAT] Enviando mensaje:', { deviceId, history });
                const res = await sendChatMessage(history, deviceId);
                console.log('[CHAT] Respuesta backend:', res);
                setMessages(prev => [...prev, { content: res.response, role: 'assistant' }]);
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd?.({ animated: true });
                }, 100);
              } catch (err) {
                setMessages(prev => [...prev, { content: 'Lo siento, hubo un error al conectar con Ágora.', role: 'assistant' }]);
              }
            }}
            disabled={!input.trim()}
            style={{ marginLeft: 8, opacity: (!input.trim()) ? 0.5 : 1 }}
          >
            <Ionicons name="arrow-up" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
