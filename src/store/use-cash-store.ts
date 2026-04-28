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
      setSession: (session) => set({ currentSession: session, isOpen: true }),
      closeSession: () => set({ currentSession: null, isOpen: false }),
    }),
    { name: 'cash-storage' }
  )
);