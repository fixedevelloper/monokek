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
 * Résout la même baseURL que l'intercepteur de requête ci-dessous (IP/Store Tauri
 * ou localStorage, sinon le défaut de l'instance) — utilisée aussi par le refresh
 * de token, qui part d'un appel axios "nu" (pas cette instance `api`) et a donc
 * besoin de recalculer cette valeur lui-même plutôt que de lire `api.defaults.baseURL`
 * (qui, lui, ne reflète jamais l'IP résolue dynamiquement).
 */
async function resolveApiBaseUrl(): Promise<string> {
    const savedIp = typeof window !== "undefined" ? await resolveBackendIp() : null;
    if (!savedIp) {
        return api.defaults.baseURL as string;
    }
    const cleanIp = savedIp.trim().replace(/\/+$/, "");
    const baseUrl = cleanIp.startsWith("https") ? cleanIp : `http://${cleanIp}`;
    return `${baseUrl}/`;
}

/**
 * INTERCEPTEUR DE REQUÊTE
 */
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Tous les appels de src/lib/api/*.ts préfixent déjà eux-mêmes leurs
        // routes avec /api/... — baseURL ne doit donc jamais inclure ce préfixe.
        config.baseURL = await resolveApiBaseUrl();

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
 * Client "app build" (pas un secret utilisateur — voir ClientSeeder côté
 * monokek-identity) utilisé uniquement pour l'appel direct à /oauth2/token
 * (refresh_token) ci-dessous.
 */
const POS_CLIENT_ID = process.env.NEXT_PUBLIC_POS_CLIENT_ID || 'monokek-pos';
const POS_CLIENT_SECRET = process.env.NEXT_PUBLIC_POS_CLIENT_SECRET || '';

/**
 * Échange le refresh_token contre un nouveau couple access/refresh token via
 * /oauth2/token — passe par la même baseURL (résolue) que le reste de l'app,
 * donc une seule instance de refresh en vol à la fois : les 401 concurrents
 * pendant le refresh attendent tous cette même promesse au lieu de déclencher
 * chacun leur propre appel /oauth2/token (qui invaliderait le refresh_token
 * des autres — reuseRefreshTokens: false côté serveur).
 */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const currentRefreshToken = useAuthStore.getState().refreshToken;
        if (!currentRefreshToken) {
            throw new Error('Aucun refresh token disponible.');
        }

        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: currentRefreshToken,
        });

        // Requête "nue" (pas l'instance `api`) : on ne veut ni son intercepteur de
        // requête (Authorization: Bearer <ancien token expiré>, sans intérêt ici —
        // /oauth2/token s'authentifie en Basic avec les identifiants du client POS)
        // ni son intercepteur de réponse (qui rappellerait ce même refresh en boucle
        // sur un 401), mais on a quand même besoin de la même baseURL résolue.
        const response = await axios.post(
            '/oauth2/token',
            body.toString(),
            {
                baseURL: await resolveApiBaseUrl(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                auth: { username: POS_CLIENT_ID, password: POS_CLIENT_SECRET },
            }
        );

        const { access_token, refresh_token, expires_in } = response.data;
        useAuthStore.getState().setTokens(access_token, refresh_token ?? currentRefreshToken, expires_in);
        return access_token as string;
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}

function forceLogout() {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // Redirection dure (pas router.push) : ce module n'a pas accès au routeur Next,
        // et une expiration de session doit de toute façon jeter tout l'état en mémoire.
        window.location.href = '/login';
    }
}

/**
 * INTERCEPTEUR DE RÉPONSE
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Gestion de l'expiration du token (401) : un token d'accès (30 min) qui expire
        // en cours de session — ex. pendant l'upload d'une image, où le temps passé dans
        // le sélecteur de fichier + l'envoi dépasse facilement 30 min — ne doit pas
        // déconnecter l'utilisateur tant que son refresh_token (30 jours) est valide.
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (!useAuthStore.getState().refreshToken) {
                forceLogout();
                return Promise.reject(error);
            }

            let newToken: string;
            try {
                newToken = await refreshAccessToken();
            } catch {
                // Le refresh_token lui-même est invalide/expiré/révoqué — là, vraie session finie.
                forceLogout();
                return Promise.reject(error);
            }

            // En dehors du try/catch ci-dessus : un échec de CETTE requête (ex: 403
            // légitime malgré un refresh réussi) ne doit pas être pris pour un échec
            // du refresh et déclencher une déconnexion forcée.
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default api;