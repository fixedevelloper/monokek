import React, { useEffect } from 'react';
import {useEcho} from "../hooks/useEcho";
import {usePrint} from "../hooks/use-print";

interface PrintWebSocketProviderProps {
    children: React.ReactNode;
}

export const PrintWebSocketProvider: React.FC<PrintWebSocketProviderProps> = ({ children }) => {
    const echo = useEcho();
    const { processPrintJob, settings } = usePrint(); // On récupère les settings (qui contiennent souvent la branche)

    useEffect(() => {
        if (!echo) {
            console.log("[PrintWS] ⏳ En attente de l'initialisation de Laravel Echo...");
            return;
        }

        // 1. Récupération du branch_id.
        // On le cherche d'abord dans les settings de l'imprimante/boutique,
        // sinon dans le stockage local (ou les infos de l'utilisateur connecté).
        const branchId = settings?.branch_id || localStorage.getItem('user_branch_id');

        if (!branchId) {
            console.warn("[PrintWS] ⚠️ Impossible de s'abonner aux impressions : 'branch_id' introuvable dans les paramètres ou le stockage local.");
            return;
        }

        console.log(`[PrintWS] 🔄 Initialisation de l'écoute temps réel pour la branche #${branchId}`);

        // 2. Nom du canal calqué exactement sur ton code Laravel : 'branch.' . $id
        const channelName = `branch.${branchId}`;
        const channel = echo.channel(channelName);

        console.log(`[PrintWS] 📡 Abonnement au canal : "${channelName}"`);

        // 3. Écoute de l'alias défini dans broadcastAs() -> 'PrintJobCreated'
        channel.listen('PrintJobCreated', async (data: any) => {
            console.log(`[PrintWS] 📥 [Événement] Nouveau Job d'impression reçu pour la branche #${branchId} !`, data);

            if (data && data.job) {
                console.log(`[PrintWS] ⚙️ Envoi du job #${data.job.id} au processeur d'impression...`);
                await processPrintJob(data.job);
            } else {
                console.warn("[PrintWS] ⚠️ Structure de payload WebSocket invalide :", data);
            }
        });

        // Nettoyage lors du démontage du composant ou du changement de branche
        return () => {
            console.log(`[PrintWS] 🧊 Désabonnement du canal : "${channelName}"`);
            echo.leave(channelName);
        };
    }, [echo, processPrintJob, settings]);

    return <>{children}</>;
};