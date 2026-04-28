import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/use-auth-store';

// 1. Détection robuste de l'environnement Tauri
export const isTauri =
    typeof window !== "undefined" &&
    window.hasOwnProperty("__TAURI_INTERNALS__");

/**
 * Instance Axios de base
 */
const api: AxiosInstance = axios.create({
    // URL par défaut si le store est vide ou si on est sur navigateur
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
// src/lib/axios.ts
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
            try {
                // Importation du plugin Store V2
                const { load } = await import("@tauri-apps/plugin-store");
                
                // On charge le store (si déjà chargé, il renvoie l'instance existante)
              const store = await load(".settings.json", {
  autoSave: true,
  defaults: {}
});
                const savedIp = await store.get<string>("backend-ip");

                if (savedIp) {
                    const cleanIp = savedIp.trim().replace(/\/+$/, "");
                    const baseUrl = cleanIp.startsWith("http") ? cleanIp : `http://${cleanIp}`;
                    config.baseURL = `${baseUrl}/`;
                }
            } catch (e) {
                console.warn("Échec récupération IP via Store V2");
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
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;