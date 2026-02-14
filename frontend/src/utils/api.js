import axios from 'axios';
import { API_BASE_URL } from '../config';
import { clearAuth, getStoredToken } from './authStorage';

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
apiInstance.interceptors.request.use((config) => {
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
        return Promise.reject(error);
    }
);

// Rigueur : On exporte des deux manieres pour eviter les erreurs d'import
export const api = apiInstance;
export default apiInstance;