"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  ChevronRight,
  Plus,
  Search,
  LayoutDashboard,
  Timer,
  LogOut,
  LockIcon,
  Monitor,
  LayoutGrid,
  TableIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { formatCurrency } from '@/src/lib/formatCurrency';
import { AddTableModal } from './AddTableModal';
import { Floor } from '@/src/types/tables';
import api from '@/src/lib/axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/src/store/use-auth-store';
import SyncStatus from '@/components/shared/SyncStatus';
import { useUIStore } from '@/src/store/use-ui-store';
import Link from 'next/link';



export default function TablesPage() {
  const router = useRouter();

  const [zones, setZones] = useState<Floor[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { setLocked } = useUIStore();

  const navItems = [
    { label: 'Vente', icon: LayoutGrid, href: '/pos' },
    { label: 'Tables', icon: TableIcon, href: '/pos/tables' },
    { label: 'Commandes', icon: History, href: '/pos/orders' },
  ];
  const logout = useAuthStore((state) => state.logout); // On suppose que tu as une action logout

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/pos/floors');
      setZones(res.data.data);
      if (res.data.data.length > 0 && !activeZoneId) {
        setActiveZoneId(res.data.data[0].id);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du plan de salle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchZones(); }, []);

  // On récupère les tables de la zone active
  const activeZone = zones.find(z => z.id === activeZoneId);
  const filteredTables = activeZone ? activeZone.tables : [];

  if (loading) return <div className="flex items-center justify-center h-screen font-black uppercase italic">Chargement du plan...</div>;

  return (
    <div className="flex flex-col h-full p-1 space-y-6">
      {/* 1. Header Dynamique */}
      <div className="p-4 bg-card border-b flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {zones.map((zone) => (
            <Button
              key={zone.id}
              variant={activeZoneId === zone.id ? "default" : "outline"}
              onClick={() => setActiveZoneId(zone.id)}
              className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest transition-all"
            >
              {zone.name}
              <span className="ml-2 opacity-50">({zone.tables.length})</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
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

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredTables.map((table) => (
            <motion.div
              key={table.id}
              layoutId={`table-${table.id}`}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              //onClick={() => table.status === 'free' && router.push(`/pos/order?table=${table.id}`)}
              onClick={() => router.push(`/pos/tables/order?table=${table.id}`)}
              className={cn(
                "relative group flex flex-col p-5 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer h-52",
                // État Disponible
                table.status === 'free'
                  ? "bg-white border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0,05)] hover:border-emerald-500/50 hover:shadow-emerald-500/10"
                  // État En cours (Occupé)
                  : table.status === 'occupied'
                    ? "bg-indigo-50/50 border-indigo-100 shadow-indigo-100/50"
                    // État Addition (Billing)
                    : "bg-amber-50/50 border-amber-200 shadow-amber-100 animate-pulse"
              )}
            >
              {/* Header : Status & Indicateur Live */}
              <div className="flex justify-between items-center">
                <Badge className={cn(
                  "text-[9px] uppercase px-3 py-1 rounded-full font-black tracking-widest border-none",
                  table.status === 'free' ? "bg-emerald-100 text-emerald-600" :
                    table.status === 'occupied' || table.status === 'reserved' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" :
                      table.status === 'billing' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" :
                        "bg-amber-500 text-white"
                )}>
                  {table.status === 'free' ? 'Libre' : table.status === 'occupied' ? 'Occupée' : 'Addition'}
                </Badge>

                {table.status === 'occupied' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </div>

              {/* Corps : Nom & Places */}
              <div className="flex-1 flex flex-col items-center justify-center py-2">
                <span className={cn(
                  "text-5xl font-black tracking-tighter italic transition-colors",
                  table.status === 'occupied' ? "text-indigo-900" : "text-slate-800"
                )}>
                  {table.name}
                </span>
                <div className="flex items-center gap-1.5 mt-1 px-3 py-1 bg-slate-100/50 rounded-full">
                  <Users size={10} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                    {table.seats} Pers.
                  </span>
                </div>
              </div>

              {/* Footer : Info Financière */}
              <div className={cn(
                "mt-auto pt-4 border-t-2 border-dashed flex items-center justify-between",
                table.status === 'occupied' ? "border-indigo-100" : "border-slate-50"
              )}>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Conso.</span>
                  <span className={cn(
                    "text-xs font-black",
                    table.total ? "text-slate-900" : "text-slate-300"
                  )}>
                    {table.total ? `${new Intl.NumberFormat().format(table.total)} FCFA` : "---"}
                  </span>
                </div>

                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  table.status === 'occupied' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  <ChevronRight size={16} strokeWidth={3} />
                </div>
              </div>

              {/* Effet de brillance au survol (Glass effect) */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/0 via-white/0 to-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}