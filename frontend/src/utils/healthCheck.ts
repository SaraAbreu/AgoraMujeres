import axios from 'axios';
import Constants from 'expo-constants';

/**
 * Health check for backend API
 * Verifies that the backend is accessible and operational
 */

export interface HealthCheckResult {
  isHealthy: boolean;
  status?: string;
  message?: string;
  responseTime: number;
}

/**
 * Get the API URL (same logic as in api.ts)
 */
function getApiUrl(): string {
  try {
    const extraUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
    if (extraUrl && extraUrl.trim()) {
      return extraUrl;
    }
  } catch (e) {
    console.log('[HealthCheck] Could not read expo config');
  }

  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl;
  }

  return 'http://localhost:8000';
}

/**
 * Check if backend is healthy
 * Returns response time and health status
 */
export const checkBackendHealth = async (): Promise<HealthCheckResult> => {
  const apiUrl = getApiUrl();
  const startTime = Date.now();

  try {
    const response = await axios.get(`${apiUrl}/api/health`, {
      timeout: 5000, // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      return {
        isHealthy: true,
        status: response.data?.status || 'ok',
        message: 'Backend is accessible',
        responseTime,
      };
    }

    return {
      isHealthy: false,
      status: 'error',
      message: `Backend responded with status ${response.status}`,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    if (error.code === 'ECONNREFUSED') {
      return {
        isHealthy: false,
        status: 'connection_refused',
        message: 'Cannot connect to backend. Check if server is running.',
        responseTime,
      };
    }

    if (error.code === 'ENOTFOUND') {
      return {
        isHealthy: false,
        status: 'not_found',
        message: 'Backend URL not found. Check your configuration.',
        responseTime,
      };
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return {
        isHealthy: false,
        status: 'timeout',
        message: 'Backend request timed out. Server might be slow.',
        responseTime,
      };
    }

    return {
      isHealthy: false,
      status: 'unknown_error',
      message: error.message || 'Backend health check failed',
      responseTime,
    };
  }
};
