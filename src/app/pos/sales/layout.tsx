"use client";

import React, { useState, useEffect } from 'react';
import {cn} from '@/lib/utils';
import SyncStatus from '@/components/layout/SyncStatus';
import {Beer, History, LayoutGrid, Lock as LockIcon, LogOut, Monitor, Table2, UserCog} from 'lucide-react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useUIStore} from '@/src/store/use-ui-store';
import {Button} from '@/components/ui/button';
import {toast} from 'sonner';
import api from '@/src/lib/axios';
import {SecurityModal} from '@/components/layout/SecurityModal';
import {CashSyncProvider} from "../../../providers/CashSyncProvider";

const NAV_ITEMS = [
  { label: 'Vente', icon: LayoutGrid, href: '/pos/sales/order' },
  { label: 'Tables', icon: Table2, href: '/pos/sales/tables' },
  { label: 'Comptoir Bar', icon: Beer, href: '/pos/sales/comptoir' },
  { label: 'Historiques', icon: History, href: '/pos/sales/history' },
] as const;

// Lecture de la valeur stockée, compatible Tauri + browser
async function getRegisterName(): Promise<string | null> {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  if (isTauri) {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load(".settings.json", { autoSave: true, defaults: {} });
    const name = await store.get<string>("register-name");
    return name ?? null;
  }

  return localStorage.getItem("register-name");
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setLocked } = useUIStore();
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [registerName, setRegisterName] = useState<string | null>(null);

  useEffect(() => {
    getRegisterName().then(setRegisterName);
  }, []);

  const updatePin = async (newPin: string) => {
    if (newPin.length !== 4) {
      return toast.error("Le code PIN doit comporter 4 chiffres");
    }
    try {
      const response = await api.post('api/auth/update-pin', { pin: newPin });
      toast.success("Code PIN modifié !");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422) {
        const firstError = Object.values(error.response.data.errors ?? {})[0] as string | undefined;
        toast.error(firstError || "Format de PIN invalide");
      } else if (error.response?.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter");
      } else {
        toast.error("Impossible de modifier le PIN. Réessayez plus tard.");
      }
      throw error;
    }
  };

  const updatePassword = async (oldPass: string, newPass: string) => {
    if (newPass.length < 8) {
      return toast.error("Le nouveau mot de passe doit faire au moins 8 caractères.");
    }
    try {
      const response = await api.post('api/auth/update-password', {
        old_password: oldPass,
        new_password: newPass,
      });
      toast.success("Mot de passe modifié avec succès !");
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 422) {
        toast.error(message || "Erreur de validation des données.");
      } else if (status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
      } else {
        toast.error("Une erreur serveur est survenue.");
      }
      throw error;
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.post('api/auth/logout');
      toast.success("Déconnexion réussie");
      router.push('/login');
    } catch {
      toast.error("Erreur lors de la déconnexion, redirection quand même.");
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
      <CashSyncProvider>
        <div className="flex flex-col h-screen bg-background overflow-hidden">

          <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 z-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                {/* ✅ Nom du terminal dynamique, fallback "Terminal" si pas encore chargé */}
                <span className="font-black text-sm uppercase tracking-tighter">
                {registerName
                    ? <><span className="text-primary">{registerName}</span></>
                    : <>Terminal <span className="text-primary">—</span></>
                }
              </span>
              </div>

              <nav className="flex items-center bg-muted rounded-lg p-1">
                {NAV_ITEMS.map((item) => (
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

            <div className="flex items-center gap-2">
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

              <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-3.5 w-3.5" />
                {isLoggingOut ? "..." : "DÉCONNEXION"}
              </button>
            </div>
          </header>

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