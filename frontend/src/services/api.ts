/**
 * api.ts — Capa de comunicación con el backend de Ágora Mujeres
 *
 * Principios:
 * - Cada función es async y lanza errores explícitos (nunca silencia)
 * - requireDeviceId() garantiza que nunca se envíe 'default-device'
 * - Los tipos reflejan exactamente lo que devuelve el backend (server.py)
 * - Un interceptor convierte todos los errores HTTP en mensajes legibles
 */

import axios from 'axios';
import Constants from 'expo-constants';

// ─────────────────────────────────────────────────────────────────────────────
// URL base
// ─────────────────────────────────────────────────────────────────────────────

function resolveApiUrl(): string {
  const fromConfig = Constants.expoConfig?.extra?.EXPO_BACKEND_URL;
  if (fromConfig?.trim()) return fromConfig.trim();

  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (fromEnv?.trim()) return fromEnv.trim();

  // Desarrollo local: Expo web corre en 8082, backend en 8000
  return 'http://192.168.1.136:8000';
}

export const API_BASE = resolveApiUrl();

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: convierte errores HTTP en mensajes legibles
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status  = error?.response?.status;
    const detail  = error?.response?.data?.detail;
    const message =
      status === 422 ? `Datos inválidos enviados al servidor (422)${detail ? ': ' + JSON.stringify(detail) : ''}` :
      status === 404 ? 'Recurso no encontrado (404)' :
      status === 500 ? 'Error interno del servidor (500)' :
      !error.response ? 'Sin conexión con el servidor' :
      `Error ${status}`;
    return Promise.reject(new Error(message));
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Guard: nunca permitir deviceId nulo o 'default-device'
// ─────────────────────────────────────────────────────────────────────────────

function requireDeviceId(deviceId: string | null | undefined, caller: string): string {
  if (!deviceId || deviceId.trim() === '' || deviceId === 'default-device') {
    throw new Error(
      `[api.ts] ${caller}: deviceId es obligatorio. ` +
      `Asegúrate de llamar await useStore.getState().initializeDevice() antes de usar la API.`
    );
  }
  return deviceId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos — reflejan exactamente los modelos Pydantic del backend
// ─────────────────────────────────────────────────────────────────────────────

export interface EmotionalState {
  calma?:        number; // 0-5
  fatiga?:       number; // 0-5
  niebla_mental?: number; // 0-5
  dolor_difuso?: number; // 0-5
  gratitud?:     number; // 0-5
  tension?:      number; // 0-5
  [key: string]: number | undefined;
}

export interface PhysicalState {
  nivel_dolor:  number; // 0-10
  energia:      number; // 0-10
  sensibilidad: number; // 0-10
}

export interface DiaryEntry {
  id:              string;
  device_id:       string;
  texto?:          string;
  emotional_state: EmotionalState;
  physical_state?: PhysicalState;
  weather?:        WeatherData;
  created_at:      string; // ISO
}

export interface DiaryEntryCreate {
  device_id:       string;
  texto?:          string;
  emotional_state: EmotionalState;
  physical_state?: PhysicalState;
  weather?:        WeatherData;
}

export interface Exercise {
  title:       string;
  description: string;
  duration:    string;
  difficulty:  'fácil' | 'moderado' | 'avanzado';
}

export interface ChatMessage {
  role:       'user' | 'assistant';
  content:    string;
  exercises?: Exercise[];
  created_at: string; // ISO
}

export interface Conversation {
  id:         string;
  title:      string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  status:                   'trial' | 'active' | 'expired';
  trial_remaining_seconds?: number;
  usage_seconds?:           number;
  is_admin?:                boolean;
}

export interface CycleEntry {
  id:         string;
  device_id:  string;
  start_date: string;
  end_date?:  string;
  notes?:     string;
  created_at: string;
}

export interface WeatherData {
  temperature: number;
  humidity:    number;
  pressure:    number;
  condition:   string;
}

export interface Patterns {
  period_days:        number;
  total_entries:      number;
  emotional_averages: EmotionalState;
  physical_averages?: PhysicalState;
  common_words:       [string, number][];
  trends: {
    highest_emotional: string;
    lowest_emotional:  string;
  };
}

export interface MonthlyPainRecord {
  device_id:        string;
  records:          PainRecord[];
  cycle_start_date: string;
  created_at?:      string;
}

export interface PainRecord {
  date:      string;
  intensity: number; // 0-10
  notes?:    string;
}

export interface Resource {
  id:                 string;
  category:           'breathing' | 'stretching' | 'nutrition' | 'sleep' | 'mindfulness' | 'professional';
  type:               'article' | 'video';
  title:              string;
  description:        string;
  content?:           string;
  video_url?:         string;
  thumbnail_url?:     string;
  author?:            string;
  author_credentials?: string;
  duration?:          string;
  read_time?:         string;
  is_featured:        boolean;
}

export interface ResourceCategory {
  id:    string;
  name:  string;
  icon:  string;
  count: number;
}

export interface CrisisResponse {
  immediate?: {
    title:   string;
    message: string;
    options: string[];
  };
  technique?: {
    title:   string;
    steps?:  string[];
    message: string;
    mantras?: string[];
  };
  all_techniques?: Array<{
    key:     string;
    title:   string;
    steps?:  string[];
    message: string;
    mantras?: string[];
  }>;
  emergency_contacts?: {
    es?: { spain?: string; general?: string };
    en?: { us?: string; uk?: string };
  };
}

export interface ChatResponse {
  response:              string;
  conversation_id:       string;
  requires_subscription: boolean;
  is_first_time?:        boolean;
  is_offline_mode?:      boolean;
  exercises?:            Exercise[];
}

export interface AdminVerifyResponse {
  success:  boolean;
  message:  string;
  is_admin: boolean;
}

export interface FavoriteMessage {
  id:         string;
  content:    string;
  category:   string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser de ejercicios embebidos en la respuesta de Ágora
// Formato: ---EJERCICIOS_RECOMENDADOS---{json}---FIN_EJERCICIOS---
// ─────────────────────────────────────────────────────────────────────────────

function parseExercises(response: string): { text: string; exercises?: Exercise[] } {
  const regex = /---EJERCICIOS_RECOMENDADOS---([\s\S]*?)---FIN_EJERCICIOS---/;
  const match = response.match(regex);
  if (!match?.[1]) return { text: response };

  try {
    const parsed = JSON.parse(match[1].trim());
    if (!Array.isArray(parsed.exercises)) return { text: response };
    return {
      text:      response.replace(regex, '').trim(),
      exercises: parsed.exercises as Exercise[],
    };
  } catch {
    return { text: response.replace(regex, '').trim() };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIARIO
// ─────────────────────────────────────────────────────────────────────────────

export async function createDiaryEntry(entry: DiaryEntryCreate): Promise<DiaryEntry> {
  requireDeviceId(entry.device_id, 'createDiaryEntry');
  const { data } = await api.post<DiaryEntry>('/diary', entry);
  return data;
}

export async function getDiaryEntries(
  deviceId: string,
  limit = 30,
  offset = 0
): Promise<DiaryEntry[]> {
  requireDeviceId(deviceId, 'getDiaryEntries');
  const { data } = await api.get<DiaryEntry[]>(`/diary/${deviceId}`, {
    params: { limit, offset },
  });
  return data;
}

export async function getPatterns(deviceId: string, days = 7): Promise<Patterns> {
  requireDeviceId(deviceId, 'getPatterns');
  const { data } = await api.get<Patterns>(`/diary/${deviceId}/patterns`, {
    params: { days },
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  message:        string,
  deviceId:       string | null | undefined,
  conversationId?: string,
  language = 'es'
): Promise<ChatResponse> {
  requireDeviceId(deviceId, 'sendChatMessage');
  if (!message?.trim())    throw new Error('El mensaje no puede estar vacío');
  if (message.length > 5000) throw new Error('Mensaje demasiado largo (máx. 5000 caracteres)');

  const { data } = await api.post<ChatResponse>('/chat', {
    device_id:       deviceId,
    message:         message.trim(),
    language,
    conversation_id: conversationId || undefined,
  });

  // Extraer ejercicios del texto de respuesta
  const { text, exercises } = parseExercises(data.response ?? '');
  return { ...data, response: text, exercises };
}

export async function getConversations(
  deviceId: string,
  limit = 20
): Promise<Conversation[]> {
  requireDeviceId(deviceId, 'getConversations');
  const { data } = await api.get<Conversation[]>(`/chat/${deviceId}/conversations`, {
    params: { limit },
  });
  return data;
}

export async function getConversationMessages(
  deviceId:       string,
  conversationId: string,
  limit = 50
): Promise<ChatMessage[]> {
  requireDeviceId(deviceId, 'getConversationMessages');
  const { data } = await api.get<ChatMessage[]>(
    `/chat/${deviceId}/conversation/${conversationId}`,
    { params: { limit } }
  );
  return data;
}

export async function deleteConversation(
  deviceId:       string,
  conversationId: string
): Promise<{ message: string; deleted_messages: number }> {
  requireDeviceId(deviceId, 'deleteConversation');
  const { data } = await api.delete(`/chat/${deviceId}/conversation/${conversationId}`);
  return data;
}

export async function getChatHistory(
  deviceId: string,
  limit = 50
): Promise<ChatMessage[]> {
  requireDeviceId(deviceId, 'getChatHistory');
  const { data } = await api.get<ChatMessage[]>(`/chat/${deviceId}/history`, {
    params: { limit },
  });
  return data;
}

export async function clearChatHistory(
  deviceId: string
): Promise<{ message: string; deleted_count: number }> {
  requireDeviceId(deviceId, 'clearChatHistory');
  const { data } = await api.delete(`/chat/${deviceId}/history`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// REACCIONES Y FAVORITOS
// ─────────────────────────────────────────────────────────────────────────────

export async function saveMessageReaction(
  deviceId:       string,
  conversationId: string,
  messageId:      string,
  reaction:       string
): Promise<{ status: string; reaction_id: string }> {
  requireDeviceId(deviceId, 'saveMessageReaction');
  const { data } = await api.post('/chat/reaction', {
    device_id:       deviceId,
    conversation_id: conversationId,
    message_id:      messageId,
    reaction,
  });
  return data;
}

export async function saveFavoriteMessage(
  deviceId:       string,
  messageContent: string,
  category = 'general'
): Promise<{ id: string; status: string }> {
  requireDeviceId(deviceId, 'saveFavoriteMessage');
  const { data } = await api.post('/chat/favorites', {
    device_id:       deviceId,
    message_content: messageContent,
    category,
  });
  return data;
}

export async function getFavoriteMessages(
  deviceId: string,
  category?: string
): Promise<FavoriteMessage[]> {
  requireDeviceId(deviceId, 'getFavoriteMessages');
  const { data } = await api.get<FavoriteMessage[]>(`/chat/favorites/${deviceId}`, {
    params: category ? { category } : undefined,
  });
  return data;
}

export async function deleteFavoriteMessage(
  deviceId:  string,
  messageId: string
): Promise<{ deleted: boolean }> {
  requireDeviceId(deviceId, 'deleteFavoriteMessage');
  const { data } = await api.delete(`/chat/favorites/${deviceId}/${messageId}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRISIS
// ─────────────────────────────────────────────────────────────────────────────

export async function getCrisisSupport(
  deviceId:   string,
  painLevel = 9,
  language  = 'es',
  symptoms?: string[]
): Promise<CrisisResponse> {
  requireDeviceId(deviceId, 'getCrisisSupport');
  const { data } = await api.post<CrisisResponse>('/crisis', {
    device_id:  deviceId,
    pain_level: painLevel,
    language,
    symptoms:   symptoms ?? [],
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUSCRIPCIÓN
// ─────────────────────────────────────────────────────────────────────────────

export async function getSubscriptionStatus(deviceId: string): Promise<SubscriptionStatus> {
  requireDeviceId(deviceId, 'getSubscriptionStatus');
  const { data } = await api.get<SubscriptionStatus>(`/subscription/${deviceId}`);
  return data;
}

export async function createCustomer(
  deviceId: string,
  email:    string,
  name?:    string
): Promise<{ customer_id: string }> {
  requireDeviceId(deviceId, 'createCustomer');
  const { data } = await api.post('/subscription/create-customer', {
    device_id: deviceId,
    email,
    name,
  });
  return data;
}

export async function createPaymentIntent(
  deviceId: string
): Promise<{ client_secret: string; payment_intent_id: string }> {
  requireDeviceId(deviceId, 'createPaymentIntent');
  const { data } = await api.post('/subscription/create-payment-intent', null, {
    params: { device_id: deviceId },
  });
  return data;
}

export async function activateSubscription(
  deviceId:        string,
  paymentIntentId: string
): Promise<{ status: string; message: string }> {
  requireDeviceId(deviceId, 'activateSubscription');
  const { data } = await api.post('/subscription/activate', null, {
    params: { device_id: deviceId, payment_intent_id: paymentIntentId },
  });
  return data;
}

export async function verifyAdminCode(
  deviceId: string,
  code:     string
): Promise<AdminVerifyResponse> {
  requireDeviceId(deviceId, 'verifyAdminCode');
  // NOTA: en el backend parcheado la ruta es /subscription/admin/verify
  // Si usas el server.py original es /admin/verify
  const { data } = await api.post<AdminVerifyResponse>('/subscription/admin/verify', {
    device_id: deviceId,
    code,
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// CICLO MENSTRUAL
// ─────────────────────────────────────────────────────────────────────────────

export async function createCycleEntry(entry: {
  device_id:  string;
  start_date: string;
  end_date?:  string;
  notes?:     string;
}): Promise<CycleEntry> {
  requireDeviceId(entry.device_id, 'createCycleEntry');
  const { data } = await api.post<CycleEntry>('/cycle', entry);
  return data;
}

export async function getCycleEntries(
  deviceId: string,
  limit = 12
): Promise<CycleEntry[]> {
  requireDeviceId(deviceId, 'getCycleEntries');
  const { data } = await api.get<CycleEntry[]>(`/cycle/${deviceId}`, {
    params: { limit },
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIMA
// ─────────────────────────────────────────────────────────────────────────────

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const { data } = await api.get<WeatherData>('/weather', {
    params: { lat, lon },
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO MENSUAL DE DOLOR
// ─────────────────────────────────────────────────────────────────────────────

export async function getMonthlyRecord(deviceId: string): Promise<MonthlyPainRecord | null> {
  requireDeviceId(deviceId, 'getMonthlyRecord');
  try {
    const { data } = await api.get<MonthlyPainRecord>(`/monthly-record/${deviceId}`);
    return data;
  } catch (e: any) {
    if (e?.message?.includes('404')) return null;
    throw e;
  }
}

export async function saveMonthlyRecord(
  deviceId: string,
  payload: { records: PainRecord[]; cycle_start_date: string }
): Promise<MonthlyPainRecord> {
  requireDeviceId(deviceId, 'saveMonthlyRecord');
  const { data } = await api.post<MonthlyPainRecord>(`/monthly-record/${deviceId}`, payload);
  return data;
}

export async function deleteMonthlyRecord(deviceId: string): Promise<void> {
  requireDeviceId(deviceId, 'deleteMonthlyRecord');
  await api.delete(`/monthly-record/${deviceId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// RECURSOS
// ─────────────────────────────────────────────────────────────────────────────

export async function getResources(
  category?: string,
  language = 'es',
  limit = 50
): Promise<Resource[]> {
  const params: Record<string, any> = { language, limit };
  if (category) params.category = category;
  const { data } = await api.get<Resource[]>('/resources', { params });
  return data;
}

export async function getResourceCategories(
  language = 'es'
): Promise<ResourceCategory[]> {
  const { data } = await api.get<ResourceCategory[]>('/resources/categories', {
    params: { language },
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMUNIDAD
// ─────────────────────────────────────────────────────────────────────────────

export async function getCommunityCount(): Promise<{
  community_size: number;
  message_es:     string;
  message_en:     string;
}> {
  const { data } = await api.get('/chat/community/count');
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export por defecto para compatibilidad con código existente
// ─────────────────────────────────────────────────────────────────────────────

export default api;
