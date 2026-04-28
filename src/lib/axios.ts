import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/use-auth-store';
import { Store } from "tauri-plugin-store-api";

// Importation dynamique ou vérification de l'environnement
const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
/**
 * Instance Axios configurée pour communiquer avec le backend Laravel.
 * On utilise les variables d'environnement pour l'URL de l'API.
 */
const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    timeout: 10000, // 10 secondes (critique pour le POS en cas de micro-coupures)
});

/**
 * INTERCEPTEUR DE REQUÊTE
 * Injecte automatiquement le token JWT ou Sanctum dans chaque appel.
 */
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // On ne tente de lire le store que si on est dans l'environnement Tauri
        if (isTauri) {
            try {
                const { Store } = await import("tauri-plugin-store-api");
                const store = new Store(".settings.dat");
                const savedIp = await store.get("backend-ip");

                if (savedIp) {
                    const baseUrl = savedIp.startsWith('http') ? savedIp : `http://${savedIp}`;
                    config.baseURL = `${baseUrl}/api`;
                }
            } catch (e) {
                console.error("Erreur Store Tauri:", e);
            }
        }

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
 * Gère les erreurs globales (401, 403, 500) et la déconnexion automatique.
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 1. Gestion de l'expiration de session (401 Unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // On vide le store et on redirige vers le login
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        // 2. Gestion spécifique pour Tauri (Offline/Network Error)
        if (!error.response) {
            console.error("Erreur réseau ou serveur injoignable.");
            // Ici tu pourrais déclencher un état 'isOffline' dans ton store de synchro
        }

        // 3. Erreur de permissions (403 Forbidden)
        if (error.response?.status === 403) {
            console.error("Accès refusé : Permissions insuffisantes.");
        }

        return Promise.reject(error);
    }
);

export default api;