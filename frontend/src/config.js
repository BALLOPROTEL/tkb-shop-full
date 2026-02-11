// Adresse du Backend (Local pour tes tests, Render pour la prod)
// Utilise VITE_API_BASE_URL si défini, sinon fallback local.
const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
