import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Indispensable pour que Laravel Echo trouve Pusher en interne
if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
}

export const initEcho = (hostIp: string) => {
    // Détecte si l'hôte est purement local (localhost ou 127.0.0.1)
    const isStrictLocal = hostIp.startsWith('127.') || hostIp.startsWith('localhost');

    // Détecte si c'est une connexion réseau local (ex: 192.168.X.X) ou un domaine de prod
    const isLanIp = hostIp.startsWith('192.168.');

    // RÈGLE : On utilise le protocole sécurisé (WSS) UNIQUEMENT si ce n'est pas du local strict et pas du LAN sans SSL
    const useTLS = !isStrictLocal && !isLanIp;

    return new Echo({
        broadcaster: 'reverb',
        key: 'oqmpqx9ghcxojmujtc4s',
        wsHost: hostIp,

        // MODIFICATION ICI :
        // - Si localhost strict (sans proxy) -> 8080
        // - Si IP Réseau Local (192.168...) -> 80 (géré par le Reverse Proxy Nginx)
        // - Si Production en ligne -> 443 (HTTPS/WSS)
        wsPort: isStrictLocal ? 8080 : (isLanIp ? 80 : 443),
        wssPort: isStrictLocal ? 8080 : (isLanIp ? 80 : 443),

        forceTLS: useTLS,
        enabledTransports: ['ws', 'wss'],
    });
};
/*
export const initEcho = (hostIp: string) => {
    const isDomain = hostIp.includes('.'); // Détection simple si c'est une URL
    const isLocal = hostIp.startsWith('192.') || hostIp.startsWith('127.')|| hostIp.startsWith('localhost');

    return new Echo({
        broadcaster: 'reverb',
        key: 'oqmpqx9ghcxojmujtc4s',
        wsHost: isDomain? hostIp: hostIp,
        // En ligne avec SSL, on utilise souvent le port 443 via un reverse proxy
        wsPort: isLocal ? 8080 : 443, 
        forceTLS: !isLocal, // Active le WSS (SSL) si on est en ligne
        enabledTransports: ['ws', 'wss'],
    });
};*/
