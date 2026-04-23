import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const TOKEN_KEY = 'userToken';
const ONBOARDING_KEY = 'onboardingDone';
const USER_KEY = 'userData';
const DEV_KEY = 'devMode';

export interface User {
  id?: string;
  name?: string;
  email?: string;
  plan?: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  devMode: boolean;
  onboardingDone: boolean;
  // NUEVOS CAMPOS PARA LA HOME
  lastGlucosa: any | null;
  lastCiclo: any | null;
  setUser: (user: User) => Promise<void>;
  setToken: (token: string) => Promise<void>;
  clearSession: () => Promise<void>;
  loadSession: () => Promise<void>;
  setDevMode: (active: boolean) => Promise<void>;
  setOnboardingDone: (done: boolean) => Promise<void>;
  // NUEVAS FUNCIONES
  setLastGlucosa: (data: any) => void;
  setLastCiclo: (data: any) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  devMode: false,
  onboardingDone: false,
  lastGlucosa: null,
  lastCiclo: null,

  setLastGlucosa: (data) => set({ lastGlucosa: data }),
  setLastCiclo: (data) => set({ lastCiclo: data }),

  setDevMode: async (active) => {
    const value = active ? '1' : '0';
    if (Platform.OS === 'web') localStorage.setItem(DEV_KEY, value);
    else await SecureStore.setItemAsync(DEV_KEY, value);
    set({ devMode: active });
  },

  setUser: async (user) => {
    const userStr = JSON.stringify(user);
    if (Platform.OS === 'web') localStorage.setItem(USER_KEY, userStr);
    else await SecureStore.setItemAsync(USER_KEY, userStr);
    set({ user });
  },

  setToken: async (token) => {
    if (Platform.OS === 'web') localStorage.setItem(TOKEN_KEY, token);
    else await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token });
  },

  clearSession: async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ONBOARDING_KEY);
      localStorage.removeItem(DEV_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(ONBOARDING_KEY);
      await SecureStore.deleteItemAsync(DEV_KEY);
    }
    set({ user: null, token: null, onboardingDone: false, devMode: false, lastGlucosa: null, lastCiclo: null });
  },

  loadSession: async () => {
    let token = null;
    let user = null;
    let devMode = false;
    let onboardingDone = false;

    try {
      if (Platform.OS === 'web') {
        token = localStorage.getItem(TOKEN_KEY);
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) user = JSON.parse(userStr);
        onboardingDone = localStorage.getItem(ONBOARDING_KEY) === '1';
      } else {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userStr = await SecureStore.getItemAsync(USER_KEY);
        if (userStr) user = JSON.parse(userStr);
        onboardingDone = (await SecureStore.getItemAsync(ONBOARDING_KEY)) === '1';
      }
    } catch (error) {
      console.error("Error al cargar la sesión:", error);
    }

    if (user && user.email === 'syntexia.ai@gmail.com') devMode = true;
    set({ token, user, devMode, onboardingDone });

    if (token && !user) {
      try {
        const profile = await import('../services/api').then(m => m.getUserProfile());
        if (profile) {
          const isDev = profile.email === 'syntexia.ai@gmail.com';
          set({ user: profile, devMode: isDev });
          const userStr = JSON.stringify(profile);
          if (Platform.OS === 'web') localStorage.setItem(USER_KEY, userStr);
          else await SecureStore.setItemAsync(USER_KEY, userStr);
        }
      } catch (e) { console.error(e); }
    }
  },

  setOnboardingDone: async (done) => {
    const value = done ? '1' : '0';
    if (Platform.OS === 'web') localStorage.setItem(ONBOARDING_KEY, value);
    else await SecureStore.setItemAsync(ONBOARDING_KEY, value);
    set({ onboardingDone: done });
  },
}));