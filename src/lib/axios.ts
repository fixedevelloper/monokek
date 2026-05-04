import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/use-auth-store';

/**
 * 1. Détection robuste de l'environnement Tauri
 */
export const isTauri =
    typeof window !== "undefined" &&
    window.hasOwnProperty("__TAURI_INTERNALS__");

/**
 * Instance Axios de base
 */
const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    timeout: 10000,
});

/**
 * INTERCEPTEUR DE REQUÊTE
 */
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
       let savedIp: string | null | undefined = null;

        if (typeof window !== "undefined") {
            if (isTauri) {
                // --- CAS TAURI (Desktop) ---
                try {
                    const { load } = await import("@tauri-apps/plugin-store");
                    const store = await load(".settings.json", {
                        autoSave: true,
                        defaults: {}
                    });
                    
                    savedIp = await store.get<string| null>("backend-ip");
                } catch (e) {
                    console.warn("Échec récupération IP via Store V2", e);
                }
            } else {
                // --- CAS NAVIGATEUR (Web / Next.js) ---
                savedIp = localStorage.getItem("backend-ip");
            }
        }

        // Si une IP est trouvée (Store ou LocalStorage), on met à jour la baseURL
        if (savedIp) {
            const cleanIp = savedIp.trim().replace(/\/+$/, "");
            // On s'assure que l'URL finit par /api si ton backend attend ce préfixe
            const baseUrl = cleanIp.startsWith("https") ?`https://${cleanIp}`  : `http://${cleanIp}`
            
            // Note : Si ton setup enregistre l'IP sans "/api", ajoute-le ici
            config.baseURL = baseUrl.endsWith('/api') ? `${baseUrl}/` : `${baseUrl}/`;
        }

        // Gestion du Token d'authentification
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * INTERCEPTEUR DE RÉPONSE
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Gestion de l'expiration du token (401)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
                // On redirige vers login en cas de session expirée
               // window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;