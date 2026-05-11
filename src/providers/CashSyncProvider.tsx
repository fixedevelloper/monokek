// components/providers/CashSyncProvider.tsx
import { useEffect } from 'react';
import {useCashStore} from "../store/use-cash-store";
import api from "../lib/axios";


export function CashSyncProvider({ children }: { children: React.ReactNode }) {
    const { setSession, closeSession } = useCashStore();

    useEffect(() => {
        const syncCash = async () => {
            try {
                const response = await api.get('/api/cash/status');

                if (response.data.session) {
                    // Si le backend a une session, on force le store à true
                    setSession(response.data.session);
                } else {
                    // Sinon, on force à false
                    closeSession();
                }
            } catch (error) {
                console.error("Erreur de synchro caisse", error);
            }
        };

        syncCash();
    }, []);

    return <>{children}</>;
}