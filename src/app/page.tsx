"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Store } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { ROLES } from "../constants/roles";

export default function RootPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Petit délai pour laisser le store se synchroniser (si nécessaire)
    const timeout = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      // Redirection intelligente basée sur les rôles définis dans tes migrations
      switch (user?.role) {
        case ROLES.ADMIN:
            router.replace("/admin");
          break;
        case ROLES.MANAGER:
          router.replace("/admin");
          break;
        case ROLES.KITCHEN:
          router.replace("/kitchen/tickets");
          break;
        case ROLES.CASHIER:
          router.replace("/pos/sales");
          break;
        case ROLES.WAITER:
          router.replace("/pos/tables");
          break;
        default:
          router.replace("/pos/tables");
          break;
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, user, router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
        {/* Logo Icon */}
        <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
          <Store className="h-10 w-10 text-primary-foreground" />
        </div>

        {/* Brand Name */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic italic">
            Mono<span className="text-primary">Kek</span>
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs uppercase tracking-widest">Initialisation du système...</span>
          </div>
        </div>
      </div>

      {/* Footer discret pour la version desktop */}
      <div className="absolute bottom-8 text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-30">
        Mono-Kek v1.0.0 • Architecture Sécurisée
      </div>
    </div>
  );
}