"use client";

import React, {useState} from 'react';
import {cn} from '@/lib/utils';
import SyncStatus from '@/components/layout/SyncStatus';
import {History, LayoutGrid, Lock as LockIcon, Monitor, UserCog} from 'lucide-react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useUIStore} from '@/src/store/use-ui-store';
import {Button} from '@/components/ui/button';
import {toast} from 'sonner';
import api from '@/src/lib/axios';
import {SecurityModal} from '@/components/layout/SecurityModal';
import {CashSyncProvider} from "../../../providers/CashSyncProvider";

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setLocked } = useUIStore();
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
  const navItems = [
    { label: 'Vente', icon: LayoutGrid, href: '/pos/sales/order' },
    { label: 'Historiques', icon: History, href: '/pos/sales/history' },
  ];

  return (
    // On garde h-screen pour bloquer la hauteur totale au viewport
      <CashSyncProvider>
        <div className="flex flex-col h-screen bg-background overflow-hidden">

          {/* Header : shrink-0 garantit qu'il ne s'écrase pas */}
          <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 z-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                <span className="font-black text-sm uppercase tracking-tighter">
              Terminal <span className="text-primary">01</span>
            </span>
              </div>

              <nav className="flex items-center bg-muted rounded-lg p-1">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                          pathname === item.href
                              ? "bg-background text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                      )}>
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </div>
                    </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <SyncStatus />
              <div className="h-8 w-[1px] bg-border mx-1" />
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSecurityOpen(true)}
                  className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary transition-all"
              >
                <UserCog className="h-4 w-4" />
              </Button>

              <button
                  onClick={() => setLocked(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors font-bold text-xs"
              >
                <LockIcon className="h-3.5 w-3.5" />
                VERROUILLER
              </button>
            </div>
          </header>

          {/* Zone de contenu : flex-1 prend tout l'espace restant sous le header */}
          <main className="flex-1 relative overflow-hidden bg-muted/10">
            {children}
          </main>
          <SecurityModal
              isOpen={isSecurityOpen}
              onOpenChange={setIsSecurityOpen}
              onUpdatePin={updatePin}
              onUpdatePassword={updatePassword}
          />
        </div>
      </CashSyncProvider>

  );
}