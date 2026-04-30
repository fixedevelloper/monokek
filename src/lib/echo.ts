import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Indispensable pour que Laravel Echo trouve Pusher en interne
if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
}

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
};