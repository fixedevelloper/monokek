import { useRouter } from 'next/navigation';
//import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '../store/use-auth-store';
import { Toaster, toast } from "sonner";
import api from '../lib/axios';

export const useAuth = () => {
  const router = useRouter();

  const { user, token, login: storeLogin, logout: storeLogout, hasPermission } = useAuthStore();

  /**
   * Connexion de l'utilisateur
   */
const login = async (credentials: any) => {
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

    // 2. Redirection intelligente
/*     if (user.role === 'admin' || user.role === 'manager') {
      router.push('/admin/reports');
    } else if (user.role === 'kitchen') {
      router.push('/kitchen/tickets');
    } else if (user.role === 'waiter') {
      router.push('/pos/tables');
    }else {
      router.push('/pos/sales');
    } */
    router.push('/');
    return true;
  } catch (error: any) {
    toast.error("Erreur de connexion", {
      description: error.message || "Impossible de joindre le serveur",
    });
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