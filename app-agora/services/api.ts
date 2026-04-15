import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 1. Configuración de la URL según la plataforma
const API_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:8001/api' 
    : 'http://127.0.0.1:8001/api';

const api = axios.create({
    baseURL: API_URL,
});

// 2. FUNCIÓN PARA OBTENER EL TOKEN (Soluciona el error de la Web)
const getStoredToken = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem('userToken');
    }
    // Solo usamos SecureStore en móvil
    return await SecureStore.getItemAsync('userToken');
};

// 3. FUNCIÓN PARA GUARDAR EL TOKEN
export const saveToken = async (token: string) => {
    if (Platform.OS === 'web') {
        localStorage.setItem('userToken', token);
    } else {
        await SecureStore.setItemAsync('userToken', token);
    }
};

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(async (config) => {
    const token = await getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
/**
 * Verifica si el motor de Syntexia está respondiendo
 */
export const checkBackendHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error("Error de salud del backend:", error);
        throw error;
    }
};

/**
 * Obtiene la tarjeta diaria de motivación
 */
export const getDailyCard = async () => {
    try {
        const response = await api.get('/daily-card');
        return response.data;
    } catch (error) {
        console.error("Error al obtener tarjeta diaria:", error);
        return null;
    }
};