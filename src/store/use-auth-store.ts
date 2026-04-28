import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
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

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  setCashSession: (sessionId: number | null) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentSessionId: null,

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
    }),
    {
      name: 'mono-kek-auth-storage', // Nom de la clé dans le localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);