import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  uuid: string;
  name: string;
  role: 'admin' | 'cashier' | 'waiter' | 'kitchen'| 'manager';
  permissions: string[];
  branch_id?: number;
}

interface AuthState {
  // Data
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentSessionId: number | null; // ID de la cash_session active
  /** True once the persisted store has finished reading localStorage — see RouteGuard for why this matters. */
  hasHydrated: boolean;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  setCashSession: (sessionId: number | null) => void;
  hasPermission: (permission: string) => boolean;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentSessionId: null,
      hasHydrated: false,

      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),

      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        currentSessionId: null 
      }),

      setCashSession: (sessionId) => set({ 
        currentSessionId: sessionId 
      }),

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        // L'admin a toujours tous les droits
        if (user.role === 'admin') return true;
        return user.permissions.includes(permission);
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'mono-kek-auth-storage', // Nom de la clé dans le localStorage
      storage: createJSONStorage(() => localStorage),
      // RouteGuard waits for this before deciding to redirect — without it, a
      // legitimately logged-in user would flash a redirect to /login on every
      // reload, since isAuthenticated briefly reads as false before the
      // persisted store finishes reading localStorage.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);