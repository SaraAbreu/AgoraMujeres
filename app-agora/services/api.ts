import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TOKEN_KEY } from '../store/userStore';

// 1. Tipos para TypeScript
interface DatosSintomas {
    device_id: string;
    sintomas: any; 
    zona: string;
    notas: string;
}

// 2. Configuración de la URL y creación de la instancia
const API_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:8001' 
    : 'http://127.0.0.1:8001';

const api = axios.create({
    baseURL: API_URL,
});

// 3. Funciones de utilidad para el Token
const getStoredToken = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const saveToken = async (token: string) => {
    if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
};

export const removeToken = async () => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
};

// 4. Interceptor (Añade el token automáticamente a TODAS las peticiones)
api.interceptors.request.use(async (config) => {
    const token = await getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 5. Funciones de la API
export const getCommunityCount = async () => {
    try {
        const response = await api.get('/chat/community/count');
        return response.data;
    } catch (error) {
        console.error('Error al obtener el contador de comunidad:', error);
        return null;
    }
};

export const getUserProfile = async () => {
    try {
        const response = await api.get('/api/me');
        return response.data;
    } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        return null;
    }
};

export const checkBackendHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error("Error de salud del backend:", error);
        throw error;
    }
};

export const getDailyCard = async () => {
    try {
        const response = await api.get('/daily-card');
        return response.data;
    } catch (error) {
        console.error("Error al obtener tarjeta diaria:", error);
        return null;
    }
};

// Registrar síntomas crónicos (Se eliminan headers manuales y se añade tipado)
export const registrarSintomasCronico = async ({ device_id, sintomas, zona, notas }: DatosSintomas) => {
    try {
        const response = await api.post('/sintomas-cronico', { device_id, sintomas, zona, notas });
        return response.data;
    } catch (error) {
        console.error('Error al registrar síntomas crónicos:', error);
        throw error;
    }
};

// Obtener síntomas crónicos (Se elimina header manual y se añade tipado string)
export const obtenerSintomasCronico = async (device_id: string) => {
    try {
        const response = await api.get(`/sintomas-cronico/${device_id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener síntomas crónicos:', error);
        return [];
    }
};

export default api;