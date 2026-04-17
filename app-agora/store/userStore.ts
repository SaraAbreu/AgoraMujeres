import create from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => Promise<void>;
  clearSession: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: async (token) => {
    await SecureStore.setItemAsync('session_token', token);
    set({ token });
  },
  clearSession: async () => {
    await SecureStore.deleteItemAsync('session_token');
    set({ user: null, token: null });
  },
  loadToken: async () => {
    const token = await SecureStore.getItemAsync('session_token');
    set({ token });
  },
}));
