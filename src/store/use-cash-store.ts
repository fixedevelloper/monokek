import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CashSession } from '@/src/types/cashier';

interface CashState {
  currentSession: CashSession | null;
  isOpen: boolean;
  setSession: (session: CashSession | null) => void;
  closeSession: () => void;
}
export const useCashStore = create<CashState>()(
    persist(
        (set) => ({
            currentSession: null,
            isOpen: false,
            setSession: (session) => set({
                currentSession: session,
                isOpen: !!session // Si session est null, isOpen sera false
            }),
            closeSession: () => set({ currentSession: null, isOpen: false }),
        }),
        { name: 'cash-storage' }
    )
);