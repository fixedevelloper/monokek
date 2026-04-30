
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronRight, CheckCircle2, Timer, Utensils, Loader2, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from '@/src/lib/utils';
import { useEcho } from '@/src/hooks/useEcho';
import api from '@/src/lib/axios';
import { Order } from '@/src/types/menus';

export default function WaiterHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeStatus, setActiveStatus] = useState('all');
  const echo = useEcho();

  const statuses = [
    { id: 'all', label: 'Tous', icon: Filter },
    { id: 'pending', label: 'En attente', icon: Timer },
    { id: 'pending_payment', label: 'En attente', icon: Timer },
    { id: 'ready', label: 'Prêt', icon: Utensils },
    { id: 'paid', label: 'Payés', icon: CheckCircle2 },
  ];

  const fetchMyOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        date: date ? format(date, 'yyyy-MM-dd') : '',
        status: activeStatus
      });
      const res = await api.get(`/api/pos/waiter/orders?${params}`);
      setOrders(res.data.data);
    } catch (error) {
      console.error("Erreur filtre serveur:", error);
    } finally {
      setLoading(false);
    }
  }, [date, activeStatus]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // Écoute WebSocket (uniquement pour la date du jour)
  useEffect(() => {
    if (!echo || date?.toDateString() !== new Date().toDateString()) return;

    const channel = echo.channel('orders')
      .listen('.order.updated', (updatedOrder: any) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      });
    new Audio('/sounds/notification.mp3').play();
    return () => echo.leaveChannel('orders');
  }, [echo, date]);
  const handleServeOrder = async (orderId: number) => {
    try {
      // Optionnel: Optimistic UI update pour plus de réactivité
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));

      await api.post(`/api/pos/orders/${orderId}/serve`);
    } catch (error) {
      console.error("Erreur lors du marquage comme servi", error);
      // Recharger en cas d'erreur
      fetchMyOrders();
    }
  };
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header Statique */}
      <div className="p-4 bg-white border-b space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Mes Services</h1>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl font-bold text-[10px] uppercase border-slate-200">
                <CalendarIcon className="w-3 h-3 mr-2" />
                {date ? format(date, "dd MMM", { locale: fr }) : "Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Filtres par Status (Scroll horizontal) */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStatus(s.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap border",
                activeStatus === s.id
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="p-4 border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98] bg-white">
              {/* Contenu du card (identique au précédent) */}
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="font-black italic text-sm">{order.reference}</span>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <Clock className="w-3 h-3" /> {order.created_at} • {order.table?.name || 'Table'}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-primary">{order.amounts.formatted_total}</p>
                  <Badge className="text-[8px] uppercase font-black px-1.5 py-0">{order.status}</Badge>
                </div>
              </div>
              {/* Section Action : Uniquement si la commande est PRÊTE */}
              {order.status === 'ready' && (
                <div className="mt-4 pt-3 border-t border-dashed flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-orange-500 animate-pulse flex items-center gap-2">
                    <Utensils className="w-3 h-3" />
                    À servir maintenant
                  </p>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Évite de cliquer sur la card
                      handleServeOrder(order.id);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] h-8 px-4 rounded-xl shadow-lg shadow-orange-200"
                  >
                    Marquer comme Servi
                  </Button>
                </div>
              )}

              {/* Si c'est déjà servi, on peut mettre un petit indicateur discret */}
              {order.status === 'completed' && (
                <div className="mt-2 flex justify-end">
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Livré à table
                  </span>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-xs font-black uppercase text-slate-400">Aucune commande</p>
          </div>
        )}
      </div>
    </div>
  );
}