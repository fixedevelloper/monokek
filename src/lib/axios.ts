import axios, {AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import {useAuthStore} from '../store/use-auth-store';

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
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    timeout: 10000,
});

/**
 * Cache de l'IP backend résolue. Sans ça, CHAQUE requête HTTP de l'app
 * (via cette instance partagée) chargeait dynamiquement le plugin Tauri Store
 * et faisait un aller-retour IPC avant même de partir — un coût répété à
 * chaque appel API pour une valeur qui ne change qu'à la configuration
 * manuelle du poste. `undefined` = pas encore résolu, `null` = résolu à "aucune IP".
 */
let cachedIp: string | null | undefined = undefined;
let ipLoadPromise: Promise<string | null> | null = null;

async function resolveBackendIp(): Promise<string | null> {
    if (cachedIp !== undefined) return cachedIp;
    if (ipLoadPromise) return ipLoadPromise;

    ipLoadPromise = (async () => {
        let ip: string | null = null;

        if (isTauri) {
            // --- CAS TAURI (Desktop) ---
            try {
                const {load} = await import("@tauri-apps/plugin-store");
                const store = await load(".settings.json", {
                    autoSave: true,
                    defaults: {}
                });

                ip = (await store.get<string | null>("backend-ip")) ?? null;
            } catch (e) {
                console.warn("Échec récupération IP via Store V2", e);
            }
        } else {
            // --- CAS NAVIGATEUR (Web / Next.js) ---
            ip = localStorage.getItem("backend-ip");
        }

        cachedIp = ip;
        ipLoadPromise = null;
        return ip;
    })();

    return ipLoadPromise;
}

/**
 * À appeler après toute écriture de "backend-ip" (Store Tauri ou localStorage)
 * pour que la requête suivante relise la nouvelle valeur au lieu du cache.
 */
export function invalidateBackendIpCache() {
    cachedIp = undefined;
    ipLoadPromise = null;
}

/**
 * INTERCEPTEUR DE REQUÊTE
 */
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const savedIp = typeof window !== "undefined" ? await resolveBackendIp() : null;

        // Si une IP est trouvée (Store ou LocalStorage), on met à jour la baseURL
        if (savedIp) {
            const cleanIp = savedIp.trim().replace(/\/+$/, "");
            // On s'assure que l'URL finit par /api si ton backend attend ce préfixe
            const baseUrl = cleanIp.startsWith("https") ? `${cleanIp}` : `http://${cleanIp}`

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
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                // Redirection dure (pas router.push) : ce module n'a pas accès au routeur Next,
                // et une expiration de session doit de toute façon jeter tout l'état en mémoire.
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;