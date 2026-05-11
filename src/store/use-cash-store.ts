import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CashState {
  currentSession: any | null;
  isOpen: boolean;
  setSession: (session: any) => void;
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