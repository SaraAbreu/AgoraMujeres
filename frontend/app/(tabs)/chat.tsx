import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Switch,
  Clipboard,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors } from '../../src/theme/colors';
import { ChatBackground } from '../../src/components/ChatBackground';
import { PaywallModal } from '../../src/components/PaywallModal';
import { VoiceButton } from '../../src/components/VoiceButton';
import { MessageActionsMenu } from '../../src/components/MessageActionsMenu';

// Importamos los servicios y el store que ya están refactorizados
import { sendChatMessage, saveMessageReaction, ChatMessage, Exercise } from '../../src/services/api';
import { useStore } from '../../src/store/useStore';
import { useVoice } from '../../src/hooks/useVoice';

// Dimensiones para diseño responsivo
const isWeb = Platform.OS === 'web';
const screenWidth = Dimensions.get('window').width;
const isSmallScreen = screenWidth < 480;

const INITIAL_MESSAGE = `Hola, soy Ágora 💚

Fui creada especialmente para acompañar a mujeres que viven con dolor crónico. Aquí no hay prisa, no hay juicio. 

Soy tu espacio seguro. Aquí puedes contar TODO: lo físico, lo emocional, lo que nadie entiende. ✨ No estás sola en esto.`;

// Componente para los puntos de escritura (Animación)
function TypingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: -10,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, anim]);

  return (
    <Animated.View style={[styles.typingDot, { transform: [{ translateY: anim }] }]} />
  );
}

export default function ChatScreen() {
  const { deviceId, diaryMessageToPushToChat, setDiaryMessageToPushToChat, enableVoiceOutput, setEnableVoiceOutput, loadSettings } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Hook de voz
  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    cleanup,
  } = useVoice({
    language: 'es-ES',
    deviceId: deviceId || 'default-device',
    baseUrl: backendUrl,
    enableSpeak: enableVoiceOutput,  // Pasar la preferencia del usuario
    onResult: (text) => {
      // Agregar el texto reconocido al input
      setInput(prev => prev + (prev.trim() ? ' ' : '') + text);
    },
    onError: (error) => {
      Alert.alert('Error de voz', error);
    },
  });

  // Inicializar con mensaje de bienvenida
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: INITIAL_MESSAGE,
        created_at: new Date().toISOString(),
      }]);
    }
    
    // Cargar preferencias guardadas
    loadSettings();
    
    return () => {
      cleanup();
    };
  }, [cleanup, loadSettings]);

  // Escuchar si viene un mensaje desde el Diario (handleWantToTalk)
  useEffect(() => {
    if (diaryMessageToPushToChat && deviceId) {
      handleSendMessage(diaryMessageToPushToChat);
      setDiaryMessageToPushToChat(null); // Limpiar mensaje procesado
    }
  }, [diaryMessageToPushToChat, deviceId]);

  // Auto-scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, loading]);

  const handleSendMessage = async (textOverride?: string) => {
    const messageText = textOverride || input.trim();
    if (!messageText || loading || !deviceId) return;

    // 1. Añadir mensaje del usuario localmente
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textOverride) setInput('');
    setLoading(true);

    try {
      // 2. Llamada a la API sólida
      const data = await sendChatMessage(messageText, conversationId, deviceId);

      // 3. Verificar si requiere suscripción
      if (data.requires_subscription) {
        setShowPaywall(true);
        // Eliminamos el último mensaje del usuario para que no parezca enviado si no hubo respuesta
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (data.conversation_id) setConversationId(data.conversation_id);

      // 4. Añadir respuesta de Ágora
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        exercises: data.exercises,
        created_at: new Date().toISOString(),
      }]);

      // 5. Reproducir respuesta si síntesis de voz está habilitada
      if (enableVoiceOutput && data.response) {
        await speak(data.response, 'es-ES');
      }

    } catch (error) {
      console.error('[Chat] Error:', error);
      Alert.alert("Error", "No pude conectar con Ágora. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  // Copiar mensaje al portapapeles
  const handleCopyMessage = async () => {
    if (selectedMessageIndex === null) return;
    
    const message = messages[selectedMessageIndex];
    try {
      await Clipboard.setString(message.content);
      Alert.alert('Copiado', 'Mensaje copiado al portapapeles');
    } catch (error) {
      console.error('Error copying message:', error);
      Alert.alert('Error', 'No se pudo copiar el mensaje');
    }
  };

  // Compartir mensaje
  const handleShareMessage = async () => {
    if (selectedMessageIndex === null) return;
    
    const message = messages[selectedMessageIndex];
    try {
      await Share.share({
        message: message.content,
        title: 'Compartir mensaje de Ágora',
      });
    } catch (error) {
      console.error('Error sharing message:', error);
    }
  };

  // Eliminar mensaje
  const handleDeleteMessage = async () => {
    if (selectedMessageIndex === null) return;
    
    Alert.alert(
      'Eliminar mensaje',
      '¿Estás segura de que quieres eliminar este mensaje?',
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => {
            setMessages(prev => prev.filter((_, i) => i !== selectedMessageIndex));
            setSelectedMessageIndex(null);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';

    return (
      <TouchableOpacity 
        style={[styles.messageWrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}
        onLongPress={() => {
          setSelectedMessageIndex(index);
          setShowMessageMenu(true);
        }}
        activeOpacity={0.7}
      >
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🍃</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.messageText, isUser ? styles.textUser : styles.textAssistant]}>
            {item.content}
          </Text>
          
          {/* Renderizado de Ejercicios si existen */}
          {item.exercises && item.exercises.map((ex, idx) => (
            <View key={idx} style={styles.exerciseCard}>
              <Text style={styles.exerciseTitle}>🧘 {ex.title}</Text>
              <Text style={styles.exerciseDesc}>{ex.description}</Text>
              <View style={styles.exerciseFooter}>
                <Text style={styles.exerciseTag}>{ex.duration}</Text>
                <Text style={styles.exerciseTag}>{ex.difficulty}</Text>
              </View>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatBackground>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={90}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Ágora</Text>
              <Text style={styles.headerSubtitle}>En línea contigo</Text>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.voiceToggle}>
                <Feather 
                  name={enableVoiceOutput ? "volume-2" : "volume-x"} 
                  size={18} 
                  color="#F5F2EF" 
                  style={{ marginRight: 8 }}
                />
                <Switch
                  value={enableVoiceOutput}
                  onValueChange={setEnableVoiceOutput}
                  trackColor={{ false: '#767577', true: '#81C784' }}
                  thumbColor={enableVoiceOutput ? '#4CAF50' : '#f4f3f4'}
                />
              </View>
              <TouchableOpacity onPress={() => setMessages([])}>
                <Feather name="refresh-cw" size={20} color="#F5F2EF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Mensajes */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.messagesList}
            renderItem={renderMessage}
            ListFooterComponent={loading ? (
              <View style={styles.typingIndicator}>
                <TypingDot delay={0} />
                <TypingDot delay={200} />
                <TypingDot delay={400} />
              </View>
            ) : null}
          />

          {/* Area de Input */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.messageInput}
              placeholder="Cuéntame cómo te sientes..."
              placeholderTextColor="#aaa"
              value={input}
              onChangeText={setInput}
              multiline
              editable={!loading}
            />
            <VoiceButton
              isListening={isListening}
              isSpeaking={isSpeaking}
              onPressStart={startListening}
              onPressStop={stopListening}
              disabled={loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={loading || !input.trim()}
            >
              <Feather name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ChatBackground>

      <PaywallModal 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        deviceId={deviceId || ''} 
      />

      <MessageActionsMenu
        visible={showMessageMenu}
        messageContent={selectedMessageIndex !== null ? messages[selectedMessageIndex]?.content || '' : ''}
        onDismiss={() => {
          setShowMessageMenu(false);
          setSelectedMessageIndex(null);
        }}
        onCopy={handleCopyMessage}
        onDelete={handleDeleteMessage}
        onShare={handleShareMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
  },
  headerTitle: { color: '#F5F2EF', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(245,242,239,0.7)', fontSize: 12 },
  messagesList: { padding: 15, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  wrapperUser: { justifyContent: 'flex-end' },
  wrapperAssistant: { justifyContent: 'flex-start' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarEmoji: { fontSize: 16 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
  },
  bubbleUser: {
    backgroundColor: '#D4A5A0',
    borderBottomRightRadius: 2,
  },
  bubbleAssistant: {
    backgroundColor: '#FFF9F0',
    borderBottomLeftRadius: 2,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  textUser: { color: '#fff' },
  textAssistant: { color: '#333' },
  inputArea: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#769656',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  typingIndicator: {
    flexDirection: 'row',
    padding: 15,
    gap: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    backgroundColor: '#769656',
    borderRadius: 4,
  },
  exerciseCard: {
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#769656',
  },
  exerciseTitle: { fontWeight: 'bold', marginBottom: 4 },
  exerciseDesc: { fontSize: 13, color: '#666' },
  exerciseFooter: { flexDirection: 'row', marginTop: 5, gap: 10 },
  exerciseTag: { fontSize: 11, color: '#769656', fontStyle: 'italic' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  voiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
});