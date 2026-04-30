import { useRouter } from 'next/navigation';
//import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '../store/use-auth-store';
import { Toaster, toast } from "sonner";
import api from '../lib/axios';

export const useAuth = () => {
  const router = useRouter();
const isTauri = typeof window !== "undefined" && window.hasOwnProperty("__TAURI_INTERNALS__");
  const { user, token, login: storeLogin, logout: storeLogout, hasPermission } = useAuthStore();

  /**
   * Connexion de l'utilisateur
   */
const login1 = async (credentials: any) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest", // Important pour Laravel
      },
      body: JSON.stringify({
        ...credentials,
        device_name: typeof window !== "undefined" ? window.navigator.userAgent : "Web Terminal",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Identifiants invalides");
    }

    const { user, token, permissions } = data;

    // 1. On stocke dans Zustand (et localStorage via ton store)
    storeLogin({ ...user, permissions }, token);

    toast.success(`Bienvenue, ${user.name}`);

    router.push('/');
    return true;
  } catch (error: any) {
    toast.error("Erreur de connexion", {
      description: error.message || "Impossible de joindre le serveur",
    });
    return false;
  }
};
const login = async (credentials: any) => {
  try {
    // 1. Appel via l'instance 'api' (Axios)
    // L'URL de base et l'IP dynamique (Tauri/Web) sont gérées par l'intercepteur
    const { data } = await api.post('/api/login', {
      ...credentials,
      device_name: isTauri ? "Tauri POS Terminal" : "Web Terminal",
    });

    // 2. Extraction des données (Laravel retourne typiquement user, token, permissions)
    const { user, token, permissions } = data;

    // 3. Mise à jour du store Zustand (persistance automatique)
    storeLogin({ ...user, permissions }, token);

    toast.success(`Bienvenue, ${user.name}`);

    // 4. Redirection vers la page d'accueil (ou terminal)
    router.push('/');
    return true;

  } catch (error: any) {
    // 5. Gestion des erreurs simplifiée avec Axios
    // On récupère le message d'erreur envoyé par Laravel (ex: validations ou mauvais pass)
    const errorMessage = error.response?.data?.message || error.message || "Impossible de joindre le serveur";

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
      await api.post('/logout');
    } finally {
      storeLogout();
      router.push('/login');
    }
  };

  /**
   * Vérifie si l'utilisateur peut effectuer une action spécifique
   * ex: can('delete_order')
   */
  const can = (permission: string) => hasPermission(permission);

  /**
   * Vérifie si une session de caisse est ouverte (Table 'cash_sessions')
   */
  const checkCashSession = async () => {
    try {
      const res = await api.get('/cash-sessions/active');
      return res.data.active;
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