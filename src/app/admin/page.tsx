"use client";

import React, {useState} from 'react';
import Link from 'next/link';
import {
  BarChart3, Briefcase,
  CalendarCheck,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  Store,
  TrendingUp,
  UserCog,
  Users,
  Utensils
} from 'lucide-react';
import {motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import {useAuthStore} from '@/src/store/use-auth-store';
import api from '@/src/lib/axios';
import {toast} from 'sonner';
import {SecurityModal} from '@/components/layout/SecurityModal';

// Types pour nos fonctionnalités
interface AdminAction {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const ADMIN_ACTIONS: AdminAction[] = [
  {
    title: "Menu & Produits",
    description: "Gérer les plats, catégories et prix",
    icon: Utensils,
    href: "/admin/menu",
    color: "bg-orange-500",
  },
  {
    title: "Plan de Salle",
    description: "Configurer les tables et les zones",
    icon: Store,
    href: "/admin/tables",
    color: "bg-blue-600",
  },
  {
    title: "Rapports & Ventes",
    description: "Statistiques quotidiennes et revenus",
    icon: BarChart3,
    href: "/admin/reports",
    color: "bg-emerald-600",
  },
  {
    title: "Personnel",
    description: "Gestion des serveurs et caissiers",
    icon: Users,
    href: "/admin/staff",
    color: "bg-purple-600",
  },
  {
    title: "Réservations",
    description: "Planning & Commandes privées",
    icon: CalendarCheck, // Plus spécifique qu'une simple icône 'Users'
    href: "/admin/reservations",
    color: "bg-indigo-600", // Un bleu-indigo puissant pour la confiance et la gestion
  },
  {
    title: "Performance",
    description: "Analytique et commissions sur ventes",
    icon: TrendingUp,
    href: "/admin/commissions",
    color: "bg-emerald-500", // Vert pour la croissance et le profit
  },
  {
    title: "Historique",
    description: "Consulter les anciennes commandes",
    icon: History,
    href: "/admin/history",
    color: "bg-slate-700",
  },
  {
    title: "Inventaire",
    description: "Gérer le stock et les ingrédients",
    icon: Package, // Utilise 'Package' ou 'Boxes' pour le stock physique
    href: "/admin/stock",
    color: "bg-red-700",
  },
  {
    title: "Mouvements",
    description: "Historique des entrées et sorties",
    icon: History, // Garde 'History' pour l'historique des flux
    href: "/admin/stock/history",
    color: "bg-amber-600",
  },
  {
    title: "Comptabilité",
    description: "Journaux et exports comptables",
    icon: Briefcase, // ou Calculator, Briefcase
    href: "/admin/accounting",
    color: "bg-blue-600", // Optionnel : change le rose pour un ton plus "finance"
  },
  {
    title: "Paramètres",
    description: "Configuration générale du système",
    icon: Settings,
    href: "/admin/settings",
    color: "bg-pink-600",
  },
];

export default function AdminPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout); // On suppose que tu as une action logout
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const updatePin = async (newPin: string) => {
    // Optionnel : Validation locale rapide avant l'appel
    if (newPin.length !== 4) {
      return toast.error("Le code PIN doit comporter 4 chiffres");
    }

    try {
      const response = await api.post('api/auth/update-pin', { pin: newPin });

      // Si tout est OK
      toast.success("Code PIN modifié !");
      return response.data;

    } catch (error: any) {
      // 1. Erreur de validation (422)
      if (error.response?.status === 422) {
        const firstError = Object.values(error.response.data.errors)[0] as string;
        toast.error(firstError || "Format de PIN invalide");
      }
      // 2. Erreur d'authentification (401)
      else if (error.response?.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter");
      }
      // 3. Autres erreurs (500, etc.)
      else {
        toast.error("Impossible de modifier le PIN. Réessayez plus tard.");
      }

      // On peut relancer l'erreur si on veut la gérer dans le composant UI
      throw error;
    }
  };

  const updatePassword = async (oldPass: string, newPass: string) => {
    // Validation client simple avant l'appel
/*    if (newPass !== confirmPass) {
      return toast.error("Les nouveaux mots de passe ne correspondent pas.");
    }*/

    if (newPass.length < 8) {
      return toast.error("Le nouveau mot de passe doit faire au moins 8 caractères.");
    }

    try {
      const response = await api.post('api/auth/update-password', {
        old_password: oldPass,
        new_password: newPass,
       // new_password_confirmation: confirmPass // Laravel attend ceci pour la règle 'confirmed'
      });

      toast.success("Mot de passe modifié avec succès !");
      return response.data;

    } catch (error: any) {
      // Gestion fine des erreurs
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 422) {
        // Erreur de validation (ex: ancien mot de passe incorrect)
        toast.error(message || "Erreur de validation des données.");
      } else if (status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
      } else {
        toast.error("Une erreur serveur est survenue.");
      }

      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      {/* Header Admin */}
      <header className="max-w-6xl mx-auto mb-10 mt-4">
        <div className="flex items-center justify-between">
          {/* Logo et Titre */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                Administration <span className="text-primary">Mono-Kek</span>
              </h1>
            </div>
            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em] ml-12">
              Panneau de gestion centralisé
            </p>
          </div>

          {/* Actions du Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSecurityOpen(true)}
              className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary transition-all"
            >
              <UserCog className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="group h-12 px-5 rounded-2xl border border-transparent hover:border-red-100 hover:bg-red-50 transition-all duration-300"
            >
              <div className="flex items-center gap-3 text-stone-500 group-hover:text-red-600 transition-colors">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Session</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Quitter</span>
                </div>
                <LogOut size={20} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* Grille d'actions */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ADMIN_ACTIONS.map((action, i) => (
          <Link key={i} href={action.href}>
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer h-full transition-all hover:shadow-xl hover:shadow-primary/5"
            >
              {/* Cercle décoratif en arrière-plan */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 ${action.color} opacity-[0.03] group-hover:opacity-[0.08] rounded-full transition-all duration-500`} />

              <div className="flex flex-col h-full gap-4">
                <div className={`${action.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-inherit/20`}>
                  <action.icon size={28} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium leading-tight">
                    {action.description}
                  </p>
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  Accéder <LayoutDashboard size={12} />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </main>

      {/* Footer / Statut */}
      <footer className="max-w-6xl mx-auto mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        <span>Version 1.0.4-build (2026)</span>
        <span className="flex items-center gap-2">
          Système Opérationnel <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </span>
      </footer>
       <SecurityModal
              isOpen={isSecurityOpen}
              onOpenChange={setIsSecurityOpen}
              onUpdatePin={updatePin}
              onUpdatePassword={updatePassword}
            />
    </div>
  );
}