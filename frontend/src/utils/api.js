import axios from 'axios';
import { API_BASE_URL } from '../config';
import { clearAuth, getStoredToken } from './authStorage';
import { prewarmForApiRequest, resetWakeForApiRequest } from './serviceWake';

/**
 * INSTANCE API EXPERT (Axios)
 * Gere automatiquement le JWT et le format JSON
 */
const apiInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour injecter le Token
apiInstance.interceptors.request.use(async (config) => {
    await prewarmForApiRequest(config.url, API_BASE_URL);

    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur pour gerer la deconnexion sur erreur 401
apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            clearAuth();
            if (window.location.pathname.startsWith('/admin')) {
                window.location.href = '/';
            }
        }

        if (
            error.response &&
            [502, 503, 504].includes(error.response.status) &&
            error.config?.url
        ) {
            // Allow the next user retry to send a fresh external wake signal.
            resetWakeForApiRequest(error.config.url, API_BASE_URL);
        }

        return Promise.reject(error);
    }
);

// Rigueur : On exporte des deux manieres pour eviter les erreurs d'import
export const api = apiInstance;
export default apiInstance;