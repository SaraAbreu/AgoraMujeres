// ============================================================
//  useStore.ts — CORREGIDO (compatibilidad Android / iOS / Web)
//  BUGS RESUELTOS:
//  [BUG-5] Estado inicial vacío: deviceId, language, etc. no inicializados
//  [BUG-6] SecureStore sin fallback para Web → ahora usa AsyncStorage en web
// ============================================================

import 'react-native-get-random-values';
import { Platform } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ─── Almacenamiento seguro con fallback para Web ──────────────
// [BUG-6 FIX] SecureStore no funciona de forma fiable en la plataforma web
// (usa localStorage internamente pero con límites silenciosos).
// En web usamos AsyncStorage directamente, que es estable.
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// ─── Generador de UUID sin dependencias nativas ───────────────
// Evita el crash "Function not implemented" de crypto.getRandomValues
// en entornos donde react-native-get-random-values no ha polyfillado aún.
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ─── Interfaz del estado ──────────────────────────────────────
interface AppState {
  // Estado
  deviceId: string | undefined;
  language: string | undefined;
  subscriptionStatus: string | undefined;
  isLoading: boolean;
  diaryMessageToPushToChat: string | undefined;
  enableVoiceOutput: boolean;

  // Acciones
  initializeDevice: () => Promise<string>;
  getDeviceId: () => Promise<string | undefined>;
  setLanguage: (lang: string) => Promise<void>;
  setSubscriptionStatus: (status: string | undefined) => void;
  setLoading: (loading: boolean) => void;
  setDiaryMessageToPushToChat: (message: string | undefined) => void;
  setEnableVoiceOutput: (enabled: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────
export const useStore = create<AppState>((set, get) => ({
  // [BUG-5 FIX] Estado inicial explícito.
  // Antes faltaban todos estos valores: el store arrancaba con
  // deviceId=undefined sin marcar porque TypeScript no lo detectaba.
  deviceId: undefined,
  language: undefined,
  subscriptionStatus: undefined,
  isLoading: false,
  diaryMessageToPushToChat: undefined,
  enableVoiceOutput: false,

  // ─── Inicializar / recuperar deviceId ──────────────────────
  initializeDevice: async () => {
    try {
      let id = await secureStorage.getItem('agora_device_id');
      if (!id) {
        id = generateUUID();
        await secureStorage.setItem('agora_device_id', id);
      }
      const savedLang = await secureStorage.getItem('agora_language');
      set({ deviceId: id, language: savedLang ?? 'es' });
      return id;
    } catch {
      // Si el almacenamiento falla (p.ej. primer arranque sin permisos),
      // usamos un ID de sesión en memoria para no bloquear la app.
      const fallbackId = generateUUID();
      set({ deviceId: fallbackId });
      return fallbackId;
    }
  },

  getDeviceId: async () => {
    const { deviceId, initializeDevice } = get();
    if (deviceId) return deviceId;
    return initializeDevice();
  },

  setLanguage: async (lang: string) => {
    await secureStorage.setItem('agora_language', lang);
    set({ language: lang });
  },

  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),

  setLoading: (loading) => set({ isLoading: loading }),

  setDiaryMessageToPushToChat: (message) => set({ diaryMessageToPushToChat: message }),

  setEnableVoiceOutput: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('agora_enable_voice_output', JSON.stringify(enabled));
      set({ enableVoiceOutput: enabled });
    } catch {
      // Si AsyncStorage falla, al menos actualizamos el estado en memoria
      set({ enableVoiceOutput: enabled });
    }
  },

  loadSettings: async () => {
    try {
      const savedLang = await secureStorage.getItem('agora_language');
      if (savedLang) set({ language: savedLang });

      const savedVoice = await AsyncStorage.getItem('agora_enable_voice_output');
      if (savedVoice !== null) {
        set({ enableVoiceOutput: JSON.parse(savedVoice) });
      }
    } catch {
      // Carga de settings no crítica: ignoramos en silencio
    }
  },
}));
