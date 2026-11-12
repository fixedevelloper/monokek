import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  uuid: string;
  name: string;
  role: 'admin' | 'cashier' | 'waiter' | 'kitchen'| 'manager' | 'warehouse';
  permissions: string[];
  branch_id?: number;
}

interface AuthState {
  // Data
  user: User | null;
  token: string | null;
  /** Long-lived (30d) — exchanged at {@code /oauth2/token} (refresh_token grant) by the axios
   * response interceptor whenever the short-lived access token expires mid-session, instead of
   * forcing a hard logout. Null for a user with no assigned client refresh token (shouldn't
   * normally happen for the POS client, but the backend can return null — see LoginResponse). */
  refreshToken: string | null;
  /** Epoch ms the current access token expires at — informational only today (the interceptor
   * reacts to a real 401 rather than pre-emptively refreshing off this). */
  tokenExpiresAt: number | null;
  isAuthenticated: boolean;
  currentSessionId: number | null; // ID de la cash_session active
  /** True once the persisted store has finished reading localStorage — see RouteGuard for why this matters. */
  hasHydrated: boolean;

  // Actions
  login: (user: User, token: string, refreshToken: string | null, expiresInSeconds: number) => void;
  /** Swaps in a fresh access/refresh token pair after a silent refresh — leaves user/isAuthenticated untouched. */
  setTokens: (token: string, refreshToken: string | null, expiresInSeconds: number) => void;
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
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      currentSessionId: null,
      hasHydrated: false,

      login: (user, token, refreshToken, expiresInSeconds) => set({
        user,
        token,
        refreshToken,
        tokenExpiresAt: Date.now() + expiresInSeconds * 1000,
        isAuthenticated: true
      }),

      setTokens: (token, refreshToken, expiresInSeconds) => set({
        token,
        refreshToken,
        tokenExpiresAt: Date.now() + expiresInSeconds * 1000,
      }),

      logout: () => set({
        user: null,
        token: null,
        refreshToken: null,
        tokenExpiresAt: null,
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