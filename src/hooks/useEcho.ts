import { useEffect, useState } from 'react';
import { initEcho } from '../lib/echo';
import { getCleanHost } from '../lib/utils'; // On importe l'utilitaire de nettoyage

export function useEcho() {
    const [echoInstance, setEchoInstance] = useState<any>(null);

    useEffect(() => {
        let echo: any = null;

        const setupEcho = async () => {
            console.log("[Echo] 🚀 Initialisation du système temps réel...");

            const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
            let rawIp = "127.0.0.1";

            // 1. Récupération de l'IP/URL
            if (isTauri) {
                try {
                    const { load } = await import("@tauri-apps/plugin-store");
                    const store = await load(".settings.json", {
                    autoSave: true,
                    defaults: {}
                });
                    const savedIp = await store.get<string>("backend-ip");
                    
                    if (savedIp) {
                        rawIp = savedIp;
                    }
                } catch (error) {
                    console.error("[Echo] ❌ Erreur Store Tauri :", error);
                }
            }

            // 2. Nettoyage de l'hôte (enlève le port si présent : 192.168.1.50:8000 -> 192.168.1.50)
            const cleanHost = getCleanHost(rawIp);
            console.log(`[Echo] 📡 Tentative de connexion vers : ${cleanHost}`);

            // 3. Initialisation de Laravel Echo
            try {
                echo = initEcho(cleanHost);
                
                const connection = echo.connector.pusher.connection;

                connection.bind('state_change', (states: any) => {
                    console.log(`[Echo] 🔄 État : ${states.previous} -> ${states.current}`);
                });

                connection.bind('connected', () => {
                    console.log(`[Echo] ✅ Connecté au serveur Reverb sur : ${cleanHost}`);
                });

                connection.bind('disconnected', () => {
                    console.warn("[Echo] 🔌 Déconnecté.");
                });

                connection.bind('error', (err: any) => {
                    console.error("[Echo] ⚠️ Erreur WebSocket :", err);
                    // Astuce : Si erreur "404" ou "Forbidden", vérifie ton fichier d'autorisation Laravel
                });

                setEchoInstance(echo);

            } catch (error) {
                console.error("[Echo] 💥 Échec critique :", error);
            }
        };

        setupEcho();

        return () => {
            if (echo) {
                console.log("[Echo] 🧊 Fermeture propre de la connexion.");
                echo.disconnect();
            }
        };
    }, []);

    return echoInstance;
}