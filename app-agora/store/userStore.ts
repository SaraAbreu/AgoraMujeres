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
  lastGlucosa: any | null;
  lastCiclo: any | null;
  hasCicloData: boolean;
  setUser: (user: User) => Promise<void>;
  setToken: (token: string) => Promise<void>;
  clearSession: () => Promise<void>;
  loadSession: () => Promise<void>;
  setDevMode: (active: boolean) => Promise<void>;
  setOnboardingDone: (done: boolean) => Promise<void>;
  setLastGlucosa: (data: any) => void;
  setLastCiclo: (data: any) => void;
  setHasCicloData: (value: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  devMode: false,
  onboardingDone: false,
  lastGlucosa: null,
  lastCiclo: null,
  hasCicloData: false,

  setLastGlucosa: (data) => set({ lastGlucosa: data }),
  setLastCiclo: (data) => set({ lastCiclo: data }),
  setHasCicloData: (value) => set({ hasCicloData: value }),

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
    
    // Verificación de DevMode al setear usuario
    const isDev = user.email === 'syntexia.ai@gmail.com';
    set({ user, devMode: isDev });
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
    // Limpiamos TODO el estado, incluyendo devMode y datos de salud
    set({ 
      user: null, 
      token: null, 
      onboardingDone: false, 
      devMode: false, 
      lastGlucosa: null, 
      lastCiclo: null 
    });
  },

  loadSession: async () => {
    let token = null;
    let user = null;
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

    // El modo dev se activa SOLO si hay un usuario cargado y es el admin
    const isDev = user && user.email === 'syntexia.ai@gmail.com';
    set({ token, user, devMode: isDev, onboardingDone });

    // Si tenemos token pero no datos de usuario, intentamos recuperarlos
    if (token && !user) {
      try {
        const api = await import('../services/api').then(m => m.default);
        const response = await api.get('/me');
        if (response.data.user) {
          const profile = response.data.user;
          const isDevProfile = profile.email === 'syntexia.ai@gmail.com';
          set({ user: profile, devMode: isDevProfile });
          
          const userStr = JSON.stringify(profile);
          if (Platform.OS === 'web') localStorage.setItem(USER_KEY, userStr);
          else await SecureStore.setItemAsync(USER_KEY, userStr);
        }
      } catch (e) { 
        console.log("Sesión expirada o error de red");
      }
    }
  },

  setOnboardingDone: async (done) => {
    const value = done ? '1' : '0';
    if (Platform.OS === 'web') localStorage.setItem(ONBOARDING_KEY, value);
    else await SecureStore.setItemAsync(ONBOARDING_KEY, value);
    set({ onboardingDone: done });
  },
}));