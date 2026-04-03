import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  userToken:  string | null;
  userData:   any | null;
  deviceId:   string | null;
  contador:   number;
  setToken:    (token: string | null) => void;
  setUserData: (data: any) => void;
  setDeviceId: (id: string) => void;
  incrementarContador: () => void;
  logout: () => void;
}

export const useUserStore = create<AppState>()(
  persist(
    (set) => ({
      userToken:  null,
      userData:   null,
      deviceId:   null,
      contador:   0,

      setToken:    (token) => set({ userToken: token }),
      setUserData: (data)  => set({ userData: data }),
      setDeviceId: (id)    => set({ deviceId: id }),

      incrementarContador: () =>
        set((state) => ({ contador: state.contador + 1 })),

      logout: () =>
        set({ userToken: null, userData: null, deviceId: null }),
    }),
    {
      name:    'agora-storage',
      storage: createJSONStorage(() => AsyncStorage), // ✅ funciona en móvil y web
    }
  )
);

export const useStore = useUserStore;