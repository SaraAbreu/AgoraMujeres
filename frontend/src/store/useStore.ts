import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired';
  trial_remaining_seconds?: number;
  usage_seconds?: number;
}

interface AppState {
  // Device
  deviceId: string | null;
  language: string;
  
  // Subscription
  subscriptionStatus: SubscriptionStatus | null;
  
  // UI State
  isLoading: boolean;
  enableVoiceOutput: boolean;  // Toggle para síntesis de voz
  
  // Diary to Chat integration
  diaryMessageToPushToChat: string | null;
  
  // Actions
  initializeDevice: () => Promise<string>;
  setLanguage: (lang: string) => Promise<void>;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setLoading: (loading: boolean) => void;
  getDeviceId: () => Promise<string>;
  setDiaryMessageToPushToChat: (message: string | null) => void;
  setEnableVoiceOutput: (enabled: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
}

// Helper for secure storage (works on web and native)
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    // Siempre usar SecureStore para datos sensibles
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // No fallback, datos sensibles deben ir cifrados
    }
  }
};

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  deviceId: null,
  language: 'es',
  subscriptionStatus: null,
  isLoading: false,
  enableVoiceOutput: true,  // Por defecto habilitado
  diaryMessageToPushToChat: null,
  
  // Initialize device ID (create if not exists)
  initializeDevice: async () => {
    try {
      let deviceId = await secureStorage.getItem('agora_device_id');
      if (!deviceId) {
        deviceId = uuidv4();
        await secureStorage.setItem('agora_device_id', deviceId);
      }
      // Load saved language (cifrado)
      const savedLang = await secureStorage.getItem('agora_language');
      set({ 
        deviceId,
        language: savedLang || 'es'
      });
      return deviceId;
    } catch (error) {
      console.error('Error initializing device:', error);
      const fallbackId = uuidv4();
      set({ deviceId: fallbackId });
      return fallbackId;
    }
  },
  
  // Get device ID (initialize if needed)
  getDeviceId: async () => {
    const state = get();
    if (state.deviceId) return state.deviceId;
    return state.initializeDevice();
  },
  
  // Set language
  setLanguage: async (lang: string) => {
    await secureStorage.setItem('agora_language', lang);
    set({ language: lang });
  },
  
  // Set subscription status
  setSubscriptionStatus: (status: SubscriptionStatus) => {
    set({ subscriptionStatus: status });
  },
  
  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  // Set diary message to push to chat
  setDiaryMessageToPushToChat: (message: string | null) => {
    set({ diaryMessageToPushToChat: message });
  },

  // Set voice output preference
  setEnableVoiceOutput: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('agora_enable_voice_output', JSON.stringify(enabled));
      set({ enableVoiceOutput: enabled });
    } catch (error) {
      console.error('Error saving voice output preference:', error);
    }
  },

  // Load all settings from storage
  loadSettings: async () => {
    try {
      // Load language
      const savedLang = await secureStorage.getItem('agora_language');
      if (savedLang) {
        set({ language: savedLang });
      }

      // Load voice output preference
      const savedVoiceOutput = await AsyncStorage.getItem('agora_enable_voice_output');
      if (savedVoiceOutput !== null) {
        set({ enableVoiceOutput: JSON.parse(savedVoiceOutput) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },
}));
