"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import SyncStatus from '@/components/layout/SyncStatus';
import { 
  Monitor, 
  LayoutGrid, 
  Table as TableIcon, 
  History, 
  Lock as LockIcon 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/src/store/use-ui-store';

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setLocked } = useUIStore();

  const navItems = [
    { label: 'Vente', icon: LayoutGrid, href: '/pos' },
    { label: 'Tables', icon: TableIcon, href: '/pos/tables' },
    { label: 'Commandes', icon: History, href: '/pos/orders' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      
      {/* 1. Header POS Ultra-Compact */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <span className="font-black text-sm uppercase tracking-tighter">
              Terminal <span className="text-primary">01</span>
            </span>
          </div>

          {/* Navigation rapide entre Grille de produits / Plan de salle */}
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
          {/* Status de synchro intégré */}
          <SyncStatus />
          
          <div className="h-8 w-[1px] bg-border mx-2" />
          
          {/* Bouton de verrouillage rapide (Lock) */}
          <button 
            onClick={() => setLocked(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors font-bold text-xs"
          >
            <LockIcon className="h-3.5 w-3.5" />
            VERROUILLER
          </button>
        </div>
      </header>


<div className="flex flex-col h-screen w-screen fixed inset-0 overflow-hidden bg-muted/10">
        {children}
      </div>

    </div>
  );
}