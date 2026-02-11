import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * INSTANCE API EXPERT (Axios)
 * Gère automatiquement le JWT et le format JSON
 */
const apiInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour injecter le Token
apiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur pour gérer la déconnexion sur erreur 401
apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            if (window.location.pathname.startsWith('/admin')) {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

// Rigueur : On exporte des deux manières pour éviter les erreurs d'import
export const api = apiInstance;
export default apiInstance;