export const AUTH_USER_KEY = 'user';
export const AUTH_TOKEN_KEY = 'access_token';

const safeJsonParse = (value) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

export const getStoredAuth = () => {
    const userRaw = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
    const user = safeJsonParse(userRaw);
    return { user, token };
};

export const getStoredUser = () => getStoredAuth().user;
export const getStoredToken = () => getStoredAuth().token;

export const setAuth = (user, token, remember = true) => {
    clearAuth();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    storage.setItem(AUTH_TOKEN_KEY, token);
};

export const updateStoredUser = (user) => {
    const hasLocal = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    const hasSession = sessionStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
    const target = hasLocal ? localStorage : hasSession ? sessionStorage : localStorage;
    target.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
};
