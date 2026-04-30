"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import SyncStatus from '@/components/layout/SyncStatus';
import {
  Monitor,
  LayoutGrid,
  Table as TableIcon,
  History,
  Lock as LockIcon,
  UserCog
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/src/store/use-ui-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/src/lib/axios';
import { SecurityModal } from '@/components/layout/SecurityModal';

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setLocked } = useUIStore();
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const updatePin = async (newPin: string) => {
    await api.post('/user/update-pin', { pin: newPin });
    toast.success("Code PIN modifié !");
  };

  const updatePassword = async (oldPass: string, newPass: string) => {
    await api.post('/user/update-password', {
      old_password: oldPass,
      new_password: newPass
    });
    toast.success("Mot de passe modifié !");
  };
  const navItems = [
    { label: 'Vente', icon: LayoutGrid, href: '/pos/sales/order' },
    { label: 'Historiques', icon: History, href: '/pos/sales/history' },
  ];

  return (
    // On garde h-screen pour bloquer la hauteur totale au viewport
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
  );
}