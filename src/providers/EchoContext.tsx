import React, { createContext, useContext, useState, useEffect } from 'react';
import { initEcho } from '../lib/echo';
import { getCleanHost } from '../lib/utils';

const EchoContext = createContext<any>(null);

export const EchoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [echoInstance, setEchoInstance] = useState<any>(null);

    useEffect(() => {
        let echo: any = null;

        const setupEcho = async () => {
            console.log("[Echo] 🚀 Initialisation UNIQUE du système temps réel...");

            const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
            let rawIp = "127.0.0.1";

            if (isTauri) {
                try {
                    const { load } = await import("@tauri-apps/plugin-store");
                    const store = await load(".settings.json", { autoSave: true, defaults: {} });
                    const savedIp = await store.get<string>("backend-ip");
                    if (savedIp) rawIp = savedIp;
                } catch (error) {
                    console.error("[Echo] ❌ Erreur Store Tauri :", error);
                }
            } else {
                rawIp = localStorage.getItem("backend-ip") ?? window.location.hostname;
            }

            const cleanHost = getCleanHost(rawIp);
            console.log(`[Echo] 📡 Tentative de connexion globale vers : ${cleanHost}`);

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
                });

                setEchoInstance(echo);
            } catch (error) {
                console.error("[Echo] 💥 Échec critique :", error);
            }
        };

        setupEcho();

        // Le disconnect ne se fera QUE si toute l'application est fermée/rechargée
        return () => {
            if (echo) {
                console.log("[Echo] 🧊 Fermeture propre de la connexion globale.");
                echo.disconnect();
            }
        };
    }, []); // Tableau de dépendances vide -> S'exécute UNE SEULE FOIS au démarrage de l'app

    return (
        <EchoContext.Provider value={echoInstance}>
            {children}
        </EchoContext.Provider>
    );
};

// Le hook réécrit pour consommer le contexte global
export function useEcho() {
    return useContext(EchoContext);
}