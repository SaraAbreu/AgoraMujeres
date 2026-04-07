import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  userToken:  string | null;
  userData:   any | null;
  deviceId:   string | null;
  contador:   number;

  // 🌿 NUEVAS PROPIEDADES
  pruebaActiva: boolean;
  horasRestantes: number;

  setToken:    (token: string | null) => void;
  setUserData: (data: any) => void;
  setDeviceId: (id: string) => void;
  incrementarContador: () => void;

  // 🌿 NUEVOS SETTERS
  setPruebaActiva: (value: boolean) => void;
  setHorasRestantes: (value: number) => void;

  logout: () => void;
}


export const useUserStore = create<AppState>()(
  persist(
    (set) => ({
      userToken:  null,
      userData:   null,
      deviceId:   null,
      contador:   0,

      // 🌿 NUEVOS VALORES INICIALES
      pruebaActiva: true,      // o false, según tu lógica
      horasRestantes: 24,      // puedes poner 0 si quieres empezar vacío

      setToken:    (token) => set({ userToken: token }),
      setUserData: (data)  => set({ userData: data }),
      setDeviceId: (id)    => set({ deviceId: id }),

      incrementarContador: () =>
        set((state) => ({ contador: state.contador + 1 })),

      // 🌿 NUEVOS SETTERS
      setPruebaActiva: (value) => set({ pruebaActiva: value }),
      setHorasRestantes: (value) => set({ horasRestantes: value }),

      logout: () =>
        set({ 
          userToken: null, 
          userData: null, 
          deviceId: null,
          pruebaActiva: false,
          horasRestantes: 0
        }),
    }),
    {
      name:    'agora-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : AsyncStorage
      ),
    }
  )
);
