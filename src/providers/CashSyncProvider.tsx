// components/providers/CashSyncProvider.tsx
import { useEffect } from 'react';
import {useCashStore} from "../store/use-cash-store";
import * as cashierApi from "../lib/api/cashier";


export function CashSyncProvider({ children }: { children: React.ReactNode }) {
    const { setSession, closeSession } = useCashStore();

    useEffect(() => {
        const syncCash = async () => {
            try {
                const status = await cashierApi.status();

                if (status.session) {
                    // Si le backend a une session, on force le store à true
                    setSession(status.session);
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