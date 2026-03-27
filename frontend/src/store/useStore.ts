import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired';
  trial_remaining_seconds?: number;
  usage_seconds?: number;
}

interface AppState {
  deviceId: string | null;
  language: string;
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  enableVoiceOutput: boolean;
  diaryMessageToPushToChat: string | null;

  initializeDevice: () => Promise<string>;
  setLanguage: (lang: string) => Promise<void>;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setLoading: (loading: boolean) => void;
  getDeviceId: () => Promise<string>;
  setDiaryMessageToPushToChat: (message: string | null) => void;
  setEnableVoiceOutput: (enabled: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async setItem(key: string, value: string): Promise<void> {
    try { await SecureStore.setItemAsync(key, value); } catch { /* noop */ }
  },
};

export const useStore = create<AppState>((set, get) => ({
  deviceId: null,
  language: 'es',
  subscriptionStatus: null,
  isLoading: false,
  enableVoiceOutput: true,
  diaryMessageToPushToChat: null,

  initializeDevice: async () => {
    try {
      let deviceId = await secureStorage.getItem('agora_device_id');
      if (!deviceId) {
        deviceId = uuidv4();
        await secureStorage.setItem('agora_device_id', deviceId);
      }
      const savedLang = await secureStorage.getItem('agora_language');
      set({ deviceId, language: savedLang || 'es' });
      return deviceId;
    } catch {
      const fallbackId = uuidv4();
      set({ deviceId: fallbackId });
      return fallbackId;
    }
  },

  getDeviceId: async () => {
    const state = get();
    if (state.deviceId) return state.deviceId;
    return state.initializeDevice();
  },

  setLanguage: async (lang: string) => {
    await secureStorage.setItem('agora_language', lang);
    set({ language: lang });
  },

  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  setLoading: (loading) => set({ isLoading: loading }),
  setDiaryMessageToPushToChat: (message) => set({ diaryMessageToPushToChat: message }),

  setEnableVoiceOutput: async (enabled) => {
    try {
      await AsyncStorage.setItem('agora_enable_voice_output', JSON.stringify(enabled));
      set({ enableVoiceOutput: enabled });
    } catch { /* noop */ }
  },

  loadSettings: async () => {
    try {
      const savedLang = await secureStorage.getItem('agora_language');
      if (savedLang) set({ language: savedLang });
      const savedVoice = await AsyncStorage.getItem('agora_enable_voice_output');
      if (savedVoice !== null) set({ enableVoiceOutput: JSON.parse(savedVoice) });
    } catch { /* noop */ }
  },
}));
