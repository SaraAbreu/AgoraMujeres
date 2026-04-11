import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Platform, FlatList, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { sendChatMessage, clearChatHistory, getChatHistory } from '../../src/services/api';
import { useUserStore } from '../../src/store/useStore';

const T = {
  forest: '#4A664D', forestDeep: '#2C3D2E', forestDim: '#3A5140',
  moss: '#6B8F6E', sage: '#A8C5A0', mint: '#D4E8D0', mintSoft: '#EAF4E8',
  cream: '#F8F7F2', parchment: '#F0EDE4', warm: '#E8E2D8',
  muted: '#9A958E', charcoal: '#3D3A35', white: '#FFFFFF', gold: '#C9A84C',
};

const GREETING = `Hola. Estoy aquí contigo.
Este es un espacio solo tuyo, sin juicios ni explicaciones. Sólo tú y lo que necesitas hoy. ¿Cómo te sientes?`;

type Exercise = { title: string; description: string; duration: string; difficulty: string };
type Msg = { content: string; role: 'user' | 'assistant'; id: string; exercises?: Exercise[] };

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(d, { toValue: -5, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ]))
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={st.typingContainer}>
      <View style={st.typingBubble}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[st.typingDot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={st.exerciseCard} onPress={() => setExpanded(e => !e)} activeOpacity={0.85}>
      <View style={st.exerciseCardHeader}>
        <View style={st.exerciseIcon}>
          <Ionicons name="leaf-outline" size={15} color={T.forest} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.exerciseTitle}>{exercise.title}</Text>
          <View style={st.exerciseMeta}>
            <Ionicons name="time-outline" size={11} color={T.muted} />
            <Text style={st.exerciseMetaText}>{exercise.duration}</Text>
            <View style={st.exerciseDot} />
            <Text style={st.exerciseMetaText}>{exercise.difficulty}</Text>
          </View>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={T.moss} />
      </View>
      {expanded && (
        <Text style={st.exerciseDesc}>{exercise.description}</Text>
      )}
    </TouchableOpacity>
  );
}

function ExerciseSection({ exercises }: { exercises: Exercise[] }) {
  return (
    <View style={st.exerciseSection}>
      <View style={st.exerciseSectionHeader}>
        <View style={st.exerciseSectionLine} />
        <Text style={st.exerciseSectionTitle}>Movimientos sugeridos</Text>
        <View style={st.exerciseSectionLine} />
      </View>
      {exercises.map((ex, i) => (
        <ExerciseCard key={i} exercise={ex} />
      ))}
    </View>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: fade, marginBottom: 6 }, !isUser && { paddingLeft: 38 }]}>
      <View style={[st.bubbleRow, isUser ? st.rowUser : st.rowAssistant]}>
        {!isUser && (
          <View style={st.avatar}>
            <Text style={st.avatarText}>Á</Text>
          </View>
        )}
        <View style={[st.bubble, isUser ? st.bubbleUser : st.bubbleAssistant]}>
          <Text style={isUser ? st.textUser : st.textAssistant}>{msg.content}</Text>
        </View>
      </View>
      {!isUser && msg.exercises && msg.exercises.length > 0 && (
        <ExerciseSection exercises={msg.exercises} />
      )}
    </Animated.View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deviceId } = useUserStore();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConvId] = useState<string | undefined>();
  const listRef = useRef<FlatList>(null);

  const scroll = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  useEffect(() => {
    if (!deviceId) return;
    getChatHistory(deviceId, 40).then(msgs => {
      if (msgs && msgs.length > 0) {
        setMessages(msgs.map((m, i) => ({
          role: m.role,
          content: m.content,
          id: i.toString(),
          exercises: (m as any).exercises,
        })));
      } else {
        setMessages([{ role: 'assistant', content: GREETING, id: '0' }]);
      }
    }).catch(() => {
      setMessages([{ role: 'assistant', content: GREETING, id: '0' }]);
    });
  }, [deviceId]);

  useEffect(() => { scroll(); }, [messages, isTyping]);

  const send = async () => {
    const text = input.trim();
    if (!text || !deviceId || isSending) return;
    const userMsg: Msg = { content: text, role: 'user', id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setIsTyping(true);
    try {
      const res = await sendChatMessage([{ role: 'user', content: text }], deviceId, conversationId);
      if (res.conversation_id) setConvId(res.conversation_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/\n{2,}/g, '\n').trim(),
        id: (Date.now() + 1).toString(),
        exercises: res.exercises,
      }]);
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
    setMessages([{ role: 'assistant', content: GREETING, id: '0' }]);
    setConvId(undefined);
  };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[T.forestDim, T.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color={T.mint} />
        </TouchableOpacity>
        <View style={st.headerAvatar}>
          <Text style={st.headerAvatarText}>Á</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.headerTitle}>Ágora</Text>
          <Text style={st.headerSub}>Tu acompañante siempre está aquí</Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={st.clearBtn}>
          <Ionicons name="refresh-outline" size={20} color={T.sage} />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <Bubble msg={item} />}
        contentContainerStyle={[st.list, { paddingBottom: 16 }]}
        ListFooterComponent={isTyping ? <TypingDots /> : null}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      <View style={[st.inputBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 80 : 12) }]}>
        <TextInput
          style={st.input}
          value={input}
          onChangeText={setInput}
          placeholder="Habla con Ágora..."
          placeholderTextColor={T.muted}
          multiline
          maxLength={500}
          blurOnSubmit={false}
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[st.sendBtn, (!input.trim() || isSending) && st.sendBtnOff]}
          onPress={send}
          disabled={!input.trim() || isSending}
        >
          {isSending ? <ActivityIndicator color={T.white} size="small" /> : <Ionicons name="arrow-up" size={18} color={T.forest} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.cream, flexDirection: 'column' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: T.white, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: T.white, fontSize: 17, fontWeight: '700' },
  headerSub: { color: T.sage, fontSize: 11, marginTop: 1 },
  clearBtn: { padding: 8 },
  list: { padding: 16, gap: 4 },
  bubbleRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: T.forest, alignItems: 'center', justifyContent: 'center', marginBottom: 2, position: 'absolute', left: -38, bottom: 0 },
  avatarText: { color: T.white, fontSize: 12, fontWeight: '700' },
  bubble: { maxWidth: '78%', padding: 14, borderRadius: 20 },
  bubbleUser: { backgroundColor: T.forest, borderBottomRightRadius: 4, alignSelf: 'flex-end' },
  bubbleAssistant: { backgroundColor: '#D8EDDA', borderBottomLeftRadius: 4, borderTopWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderTopColor: T.moss, borderRightColor: T.moss, borderBottomColor: T.moss, borderLeftWidth: 5, borderLeftColor: T.forestDeep, shadowColor: T.forest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5 },
  textUser: { color: T.white, fontSize: 15, lineHeight: 22 },
  textAssistant: { color: T.forestDeep, fontSize: 15, lineHeight: 24, letterSpacing: 0.1 },
  typingContainer: { paddingLeft: 42, marginBottom: 12 },
  typingBubble: { flexDirection: 'row', gap: 5, padding: 14, backgroundColor: T.white, borderRadius: 20, borderBottomLeftRadius: 4, alignSelf: 'flex-start', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.moss },
  exerciseSection: { marginTop: 6, marginBottom: 4 },
  exerciseSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  exerciseSectionLine: { flex: 1, height: 1, backgroundColor: T.mint },
  exerciseSectionTitle: { fontSize: 11, color: T.moss, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  exerciseCard: { backgroundColor: T.white, borderRadius: 14, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: T.mint, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  exerciseCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: T.mintSoft, alignItems: 'center', justifyContent: 'center' },
  exerciseTitle: { fontSize: 14, fontWeight: '600', color: T.charcoal, marginBottom: 2 },
  exerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exerciseMetaText: { fontSize: 11, color: T.muted },
  exerciseDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: T.muted },
  exerciseDesc: { fontSize: 13, color: T.charcoal, lineHeight: 19, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: T.mint },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: T.parchment, paddingLeft: 16, paddingRight: 16, paddingTop: 14, borderTopWidth: 1.5, borderTopColor: T.warm, shadowColor: T.forestDeep, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 8 },
  input: { flex: 1, minWidth: 0, fontSize: 15, color: T.charcoal, maxHeight: 100, paddingVertical: 10, paddingHorizontal: 14, lineHeight: 21, backgroundColor: T.white, borderRadius: 22, borderWidth: 1.5, borderColor: T.sage },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.white, borderWidth: 2, borderColor: T.forest, alignItems: 'center', justifyContent: 'center', shadowColor: T.forestDeep, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4, flexShrink: 0 },
  sendBtnOff: { backgroundColor: T.muted, shadowOpacity: 0 },
});
