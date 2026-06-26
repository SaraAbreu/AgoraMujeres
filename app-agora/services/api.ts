import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TOKEN_KEY } from '../store/userStore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DatosSintomas {
    device_id: string;
    sintomas: any;
    zona: string;
    notas: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
    conversation_id?: string;
}

export interface ChatConversation {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
}

export interface ChatResponse {
    response: string;
    conversation_id: string;
    requires_subscription: boolean;
    is_first_time: boolean;
    is_offline_mode: boolean;
}

// ─── URL base ─────────────────────────────────────────────────────────────────

// services/api.ts

export const API_URL = Platform.OS === 'web'
    ? 'https://agoramujeres.syntexia-solutions.es/api' // HTTPS en producción (via Nginx proxy)
    : Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : 'http://localhost:8001';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000, // Añadimos timeout para que no se quede colgado
    headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getStoredToken = async () => {
    if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const saveToken = async (token: string) => {
    if (Platform.OS === 'web') localStorage.setItem(TOKEN_KEY, token);
    else await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const removeToken = async () => {
    if (Platform.OS === 'web') localStorage.removeItem(TOKEN_KEY);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
};

/** Extrae el device_id (= sub del JWT) sin verificar firma. */
export const getDeviceIdFromToken = async (): Promise<string | null> => {
    try {
        const token = await getStoredToken();
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub ?? null;
    } catch {
        return null;
    }
};

// ─── Interceptor ─────────────────────────────────────────────────────────────

api.interceptors.request.use(async (config) => {
    const token = await getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

// ─── Endpoints existentes ─────────────────────────────────────────────────────

export const getCommunityCount = async () => {
    try {
        const response = await api.get('/chat/community/count');
        return response.data;
    } catch (error) {
        console.error('Error al obtener el contador de comunidad:', error);
        return null;
    }
};

export const getUserStats = async () => {
    try {
        const response = await api.get('/user/stats');
        return response.data;
    } catch (error) {
        console.error('Error al obtener stats:', error);
        return null;
    }
};

export const checkBackendHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (error) {
        console.error('Error de salud del backend:', error);
        throw error;
    }
};

export const registrarSintomasCronico = async ({ device_id, sintomas, zona, notas }: DatosSintomas) => {
    try {
        const response = await api.post('/sintomas-cronico', { device_id, sintomas, zona, notas });
        return response.data;
    } catch (error) {
        console.error('Error al registrar síntomas crónicos:', error);
        throw error;
    }
};

export const obtenerSintomasCronico = async (device_id: string) => {
    try {
        const response = await api.get(`/sintomas-cronico/${device_id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener síntomas crónicos:', error);
        return [];
    }
};

// ─── Endpoints de Chat ────────────────────────────────────────────────────────

/**
 * Envía un mensaje a Ágora y devuelve la respuesta.
 */
export const sendChatMessage = async (
    device_id: string,
    message: string,
    conversation_id?: string,
    language: string = 'es'
): Promise<ChatResponse> => {
    const response = await api.post('/chat', {
        device_id,
        message,
        language,
        conversation_id: conversation_id ?? null,
    });
    return response.data;
};

/**
 * Obtiene el historial de mensajes de la conversación más reciente.
 */
export const getChatHistory = async (
    device_id: string,
    limit: number = 50
): Promise<ChatMessage[]> => {
    try {
        const response = await api.get(`/chat/${device_id}/history`, {
            params: { limit },
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error recuperando historial:", error);
        return []; // Devolvemos array vacío para que la app no explote
    }
};

/**
 * Obtiene la lista de conversaciones del usuario.
 */
export const getConversations = async (
    device_id: string
): Promise<ChatConversation[]> => {
    try {
        const response = await api.get(`/chat/${device_id}/conversations`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        return [];
    }
};

/**
 * Obtiene los mensajes de una conversación específica.
 */
export const getConversationMessages = async (
    device_id: string,
    conversation_id: string,
    limit: number = 50
): Promise<ChatMessage[]> => {
    try {
        const response = await api.get(
            `/chat/${device_id}/conversation/${conversation_id}`,
            { params: { limit } }
        );
        return response.data;
    } catch (error) {
        console.error('Error al obtener mensajes de conversación:', error);
        return [];
    }
};

/**
 * Elimina el historial de la conversación más reciente.
 */
export const clearChatHistory = async (device_id: string) => {
    try {
        const response = await api.delete(`/chat/${device_id}/history`);
        return response.data;
    } catch (error) {
        console.error('Error al limpiar historial:', error);
        throw error;
    }
};

// ─── Endpoints de Suscripción ─────────────────────────────────────────────────

// Formato real que devuelve el backend
export interface SubscriptionStatus {
    status: 'trial' | 'active' | 'expired';
    is_admin: boolean;
    trial_remaining_seconds?: number;
    trial_end?: string;
    usage_seconds?: number;
}

/**
 * Devuelve el estado actual de la suscripción del usuario.
 */
export const getSubscriptionStatus = async (device_id: string): Promise<SubscriptionStatus | null> => {
    try {
        const res = await api.get(`/subscription/${device_id}`);
        return res.data;
    } catch (error) {
        console.error('Error al obtener estado de suscripción:', error);
        return null;
    }
};

/**
 * Crea una sesión del Stripe Customer Portal y devuelve la URL.
 */
export const createCustomerPortalSession = async (device_id: string): Promise<string | null> => {
    try {
        const res = await api.post(`/subscription/customer-portal?device_id=${device_id}`);
        return res.data?.url ?? null;
    } catch (error) {
        console.error('Error al crear sesión del portal:', error);
        return null;
    }
};

// ─── Exportación por defecto ──────────────────────────────────────────────────

export default api;