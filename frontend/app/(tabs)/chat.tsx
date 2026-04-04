import React, { useState, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, FlatList, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { sendChatMessage, clearChatHistory } from '../../src/services/api';
import { useUserStore } from '../../src/store/useStore';

const T = {
  forest:'#4A664D', forestDim:'#3A5140', moss:'#6B8F6E', sage:'#A8C5A0',
  mint:'#D4E8D0', mintSoft:'#EAF4E8', cream:'#F8F7F2', parchment:'#F0EDE4',
  muted:'#9A958E', charcoal:'#3D3A35', white:'#FFFFFF', warm:'#E8E2D8',
};

type Msg = { content: string; role: 'user' | 'assistant'; id: string };

// ── Typing indicator ─────────────────────────────────────────
function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(d, { toValue: -5, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0,  duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ]))
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
}

// ── Message bubble ───────────────────────────────────────────
function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.bubbleRow, isUser ? styles.rowUser : styles.rowAssistant, { opacity: fadeAnim }]}>
      {!isUser && (
        <View style={styles.agoraAvatar}>
          <Text style={styles.agoraAvatarText}>Á</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={isUser ? styles.textUser : styles.textAssistant}>{msg.content}</Text>
        {!isUser && (
          <TouchableOpacity
            onPress={() => Speech.speak(msg.content, { language: 'es-ES', rate: 0.88 })}
            style={styles.speakBtn}
          >
            <Ionicons name="volume-medium-outline" size={14} color={T.moss} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId, userData } = useUserStore();
  const isPremium = userData?.is_premium || false;

  const [messages, setMessages]       = useState<Msg[]>([]);
  const [input, setInput]             = useState('');
  const [isSending, setIsSending]     = useState(false);
  const [isTyping, setIsTyping]       = useState(false);
  const [conversationId, setConvId]   = useState<string | undefined>();
  const [msgCount, setMsgCount]       = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scroll = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);

  // Init greeting
  useEffect(() => {
    if (!deviceId || messages.length > 0) return;
    setIsTyping(true);
    sendChatMessage([{ role: 'user', content: 'Hola Ágora' }], deviceId)
      .then(res => {
        setConvId(res.conversation_id);
        setMessages([{ role: 'assistant', content: res.response, id: Date.now().toString() }]);
      })
      .catch(() => {
        setMessages([{ role: 'assistant', content: 'Hola. Estoy aquí contigo. ¿Cómo te sientes hoy?', id: '0' }]);
      })
      .finally(() => setIsTyping(false));
  }, [deviceId]);

  useEffect(() => { scroll(); }, [messages, isTyping]);

  const send = async () => {
    const text = input.trim();
    if (!text || !deviceId || isSending) return;
    if (msgCount >= 5 && !isPremium) { setShowPaywall(true); return; }

    const userMsg: Msg = { content: text, role: 'user', id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setIsTyping(true);

    try {
      const res = await sendChatMessage([{ role: 'user', content: text }], deviceId, conversationId);
      if (res.conversation_id) setConvId(res.conversation_id);
      if (res.requires_subscription) { setShowPaywall(true); return; }
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, id: (Date.now() + 1).toString() }]);
      setMsgCount(c => c + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Mi conexión se ha debilitado un momento. ¿Volvemos a intentarlo?',
        id: (Date.now() + 1).toString(),
      }]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (!deviceId) return;
    await clearChatHistory(deviceId).catch(() => {});
    setMessages([]);
    setConvId(undefined);
    setMsgCount(0);
  };

  if (showPaywall) {
    return <PaywallScreen onClose={() => setShowPaywall(false)} onSubscribe={() => router.push('/subscription')} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Header */}
      <LinearGradient
        colors={[T.forestDim, T.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerInner}>
          <View style={styles.agoraHeaderAvatar}>
            <Text style={styles.agoraHeaderLetter}>Á</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Ágora</Text>
            <Text style={styles.headerSub}>Tu acompañante siempre está aquí</Text>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Ionicons name="refresh-outline" size={20} color={T.sage} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <Bubble msg={item} />}
        contentContainerStyle={styles.list}
        ListFooterComponent={isTyping ? <TypingDots /> : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Habla con Ágora..."
          placeholderTextColor={T.muted}
          multiline
          maxLength={500}
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!input.trim() || isSending}
        >
          {isSending
            ? <ActivityIndicator color={T.white} size="small" />
            : <Ionicons name="arrow-up" size={18} color={T.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Warm paywall ─────────────────────────────────────────────
function PaywallScreen({ onClose, onSubscribe }: { onClose: () => void; onSubscribe: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.paywallRoot}>
      <LinearGradient colors={[T.cream, T.parchment]} style={styles.paywallGrad}>
        <Animated.View style={[styles.paywallContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.paywallLeaf}>🌿</Text>
          <Text style={styles.paywallTitle}>Has llegado al límite de mensajes de hoy</Text>
          <Text style={styles.paywallBody}>
            Ágora seguirá aquí cuando la necesites. Para continuar sin límites y apoyar este espacio de cuidado, puedes activar tu acompañamiento.
          </Text>
          <TouchableOpacity onPress={onSubscribe} activeOpacity={0.88}>
            <LinearGradient colors={[T.forest, T.moss]} style={styles.paywallBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.paywallBtnText}>Ver opciones de acompañamiento</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.paywallClose}>
            <Text style={styles.paywallCloseText}>Volver al refugio</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agoraHeaderAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  agoraHeaderLetter: { color: T.white, fontSize: 18, fontWeight: '700' },
  headerTitle: { color: T.white, fontSize: 18, fontWeight: '700', flex: 1 },
  headerSub:   { color: T.sage, fontSize: 11 },
  clearBtn:    { padding: 6 },

  list: { padding: 16, paddingBottom: 20, gap: 4 },

  bubbleRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end', gap: 8 },
  rowUser:      { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },

  agoraAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: T.forest, alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  agoraAvatarText: { color: T.white, fontSize: 12, fontWeight: '700' },

  bubble: { maxWidth: '78%', padding: 14, borderRadius: 20 },
  bubbleUser:      { backgroundColor: T.forest, borderBottomRightRadius: 4 },
  bubbleAssistant: {
    backgroundColor: T.white, borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  textUser:      { color: T.white, fontSize: 15, lineHeight: 22 },
  textAssistant: { color: T.charcoal, fontSize: 15, lineHeight: 22 },
  speakBtn:      { marginTop: 8, alignSelf: 'flex-end' },

  typingContainer:  { paddingLeft: 42 },
  typingBubble: {
    flexDirection: 'row', gap: 5, padding: 14,
    backgroundColor: T.white, borderRadius: 20, borderBottomLeftRadius: 4,
    alignSelf: 'flex-start', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.moss },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: T.white, paddingHorizontal: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#EDEAE4',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 6,
  },
  input: {
    flex: 1, fontSize: 15, color: T.charcoal, maxHeight: 100,
    paddingVertical: 8, lineHeight: 21,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: T.forest, alignItems: 'center', justifyContent: 'center',
    shadowColor: T.forest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: T.muted, shadowOpacity: 0 },

  paywallRoot:    { flex: 1 },
  paywallGrad:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  paywallContent: { alignItems: 'center', maxWidth: 340 },
  paywallLeaf:    { fontSize: 52, marginBottom: 20 },
  paywallTitle:   { fontSize: 22, fontWeight: '700', color: T.charcoal, textAlign: 'center', marginBottom: 14, lineHeight: 30 },
  paywallBody:    { fontSize: 15, color: T.muted, textAlign: 'center', lineHeight: 24, marginBottom: 30, fontStyle: 'italic' },
  paywallBtn: {
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 30,
    shadowColor: T.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  paywallBtnText: { color: T.white, fontSize: 15, fontWeight: '700' },
  paywallClose:   { marginTop: 18 },
  paywallCloseText: { color: T.muted, fontSize: 14 },
});