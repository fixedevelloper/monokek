  import { useRouter } from 'next/navigation';
//import { useToast } from '@/components/ui/use-toast';
import { useAuthStore, User } from '../store/use-auth-store';
import { Toaster, toast } from "sonner";
import { useUIStore } from '../store/use-ui-store';
import * as identityApi from '../lib/api/identity';
import api from '../lib/axios';
import { getErrorMessage } from '../lib/errors';

export const useAuth = () => {
  const router = useRouter();
  const isTauri = typeof window !== "undefined" && window.hasOwnProperty("__TAURI_INTERNALS__");
  const { user, token, login: storeLogin, logout: storeLogout, hasPermission } = useAuthStore();
  const { isLocked, setLocked } = useUIStore();
  /**
   * Connexion de l'utilisateur
   */
  const login = async (credentials: { email: string; password: string }) => {
    try {
      const { user: summary, token, refreshToken, expiresInSeconds } = await identityApi.login(
          credentials.email,
          credentials.password,
          isTauri ? "Tauri POS Terminal" : "Web Terminal",
      );

      // 2. Fetch the full profile (roles/permissions) now that we have a token.
      // Pass it explicitly: the Zustand auth store (storeLogin below) hasn't
      // written it yet, so the axios interceptor has nothing to attach.
      const staff = await identityApi.me(token);

      // 3. Mise à jour du store Zustand (persistance automatique)
      storeLogin({
        id: summary.id,
        uuid: staff.uuid,
        name: summary.name,
        role: (summary.role as User['role']) ?? 'waiter',
        permissions: staff.permissions,
      }, token, refreshToken, expiresInSeconds);

      toast.success(`Bienvenue, ${summary.name}`);

      // 4. Redirection vers la page d'accueil (ou terminal)
      router.push('/');
      return true;

    } catch (error) {
      // 5. Gestion des erreurs simplifiée avec Axios
      // On récupère le message d'erreur envoyé par le backend (ex: validations ou mauvais pass)
      const errorMessage = getErrorMessage(error, "Impossible de joindre le serveur");

      toast.error("Erreur de connexion", {
        description: errorMessage,
      });

      console.error("Login Error:", error);
      return false;
    }
  };

  /**
   * Déconnexion complète
   */
  const logout = async () => {
    try {
      await identityApi.logout();
    } finally {
      storeLogout();
      setLocked(false)
      router.push('/login');
    }
  };

  /**
   * Vérifie si l'utilisateur peut effectuer une action spécifique
   * ex: can('delete_order')
   */
  const can = (permission: string) => hasPermission(permission);

  /**
   * Vérifie si une session de caisse est ouverte
   */
  const checkCashSession = async () => {
    try {
      // CashController#status renvoie un CashStatusDto brut, pas d'enveloppe ApiResponse.
      const response = await api.get<{ isOpen: boolean }>('/api/cash/status');
      return response.data.isOpen;
    } catch {
      return false;
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    can,
    checkCashSession,
    isAdmin: user?.role === 'admin',
    isKitchen: user?.role === 'kitchen',
    isWaiter: user?.role === 'waiter',
    isManager: user?.role === 'manager',
  };
};