"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Utensils, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Store
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUIStore } from '@/store/use-ui-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/auth/RoleGuard';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin', roles: ['admin', 'manager'] },
  { label: 'Caisse POS', icon: ShoppingCart, href: '/pos', roles: ['admin', 'cashier', 'waiter'] },
  { label: 'Cuisine', icon: Utensils, href: '/kitchen', roles: ['admin', 'kitchen'] },
  { label: 'Stocks', icon: Package, href: '/inventory', roles: ['admin', 'manager'] },
  { label: 'Rapports', icon: BarChart3, href: '/reports', roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside className={cn(
      "h-screen bg-card border-r flex flex-col transition-all duration-300 shadow-xl z-20",
      isSidebarOpen ? "w-64" : "w-20"
    )}>
      
      {/* 1. Header : Logo & Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <Store className="text-primary-foreground h-6 w-6" />
        </div>
        {isSidebarOpen && (
          <span className="font-black text-xl tracking-tighter uppercase italic">
            Mono<span className="text-primary">Kek</span>
          </span>
        )}
      </div>

      {/* 2. Navigation Principale */}
      <nav className="flex-1 px-3 space-y-2 mt-4">
        {MENU_ITEMS.map((item) => (
          <RoleGuard key={item.href} allowedRoles={item.roles as any}>
            <Link href={item.href}>
              <div className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer relative",
                pathname.startsWith(item.href) 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}>
                <item.icon className={cn("h-5 w-5 shrink-0", pathname.startsWith(item.href) ? "" : "group-hover:scale-110 transition-transform")} />
                {isSidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}
                
                {pathname.startsWith(item.href) && isSidebarOpen && (
                  <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                )}
              </div>
            </Link>
          </RoleGuard>
        ))}
      </nav>

      {/* 3. Footer : Profil & Settings */}
      <div className="p-4 border-t space-y-4">
        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground transition-colors",
            pathname === '/settings' && "text-primary"
          )}>
            <Settings className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Réglages</span>}
          </div>
        </Link>

        <div className={cn(
          "bg-muted/50 rounded-2xl p-3 flex items-center gap-3 transition-all",
          !isSidebarOpen && "justify-center bg-transparent"
        )}>
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-violet-500 shrink-0 border-2 border-background flex items-center justify-center font-bold text-white uppercase">
            {user?.name?.charAt(0)}
          </div>
          
          {isSidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate uppercase tracking-tight">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{user?.role}</p>
            </div>
          )}

          {isSidebarOpen && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}