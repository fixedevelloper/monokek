"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChefHat, Loader2, BellRing, LockIcon,
  ChevronLeft, Timer, CheckCircle2, PlayCircle
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import api from "@/src/lib/axios";
import { KitchenTicket } from "@/src/types/tables";
import { cn } from "@/lib/utils";
import { useEcho } from "@/src/hooks/useEcho";

export default function KitchenTicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // On récupère l'ID de la station depuis l'URL (?tiket=ID)
  const stationId = searchParams.get('station');

  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const echo = useEcho();
  // 1. Fetch des tickets de la station
  const fetchTickets = async () => {
    if (!stationId) return;
    try {

      const { data } = await api.get(`/api/kitchen/tickets`, {
        params: { station_id: stationId }
      });
      setTickets(data.data);
    } catch (error) {
      toast.error("Erreur de synchronisation");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!echo) return;

    const channel = echo.channel(`kitchen.station.${stationId}`)
      .listen('.ticket.created', (ticket: any) => {
        // Le bar reçoit UNIQUEMENT ses boissons
        console.log("Nouveau ticket cuisine:", ticket);
        setTickets(prev => [ticket, ...prev]);

        // Notification sonore spécifique à la station
        new Audio('/sounds/notification.mp3').play();
      });

    return () => echo.leaveChannel(`kitchen.station.${stationId}`);
  }, [echo, stationId]);
  useEffect(() => {
    fetchTickets();
    // Optionnel : Polling toutes les 30 secondes pour les nouveaux tickets
    /*     const interval = setInterval(fetchTickets, 30000);
        return () => clearInterval(interval); */
  }, [stationId]);

  // 2. Mise à jour du statut (Appel API Réel)
  const handleStatusChange = async (ticketId: number, nextStatus: string) => {
    try {
      await api.patch(`/api/kitchen/tickets/${ticketId}/status`, {
        status: nextStatus
      });

      // Mise à jour locale pour la réactivité
      setTickets(prev => prev.map(t =>
        t.id === ticketId ? { ...t, status: nextStatus as any } : t
      ));

      toast.success(`Ticket marqué comme ${nextStatus}`);
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  if (!stationId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <h2 className="font-black uppercase italic">Aucune station sélectionnée</h2>
        <Button onClick={() => router.push('/kitchen')}>Retour au Dashboard</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Initialisation KDS...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">

      {/* HEADER CUISINE (Design Premium) */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm z-20">
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/kitchen')}
              className="rounded-2xl h-12 w-12 bg-slate-100 dark:bg-slate-800"
            >
              <ChevronLeft size={24} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                <ChefHat size={28} />
              </div>
              <div>
                <h1 className="font-black text-xl uppercase italic tracking-tighter leading-none">Station de préparation</h1>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Flux en direct
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-2xl font-black text-primary">{tickets.length}</span>
              <span className="text-[9px] font-black uppercase opacity-50">Tickets Actifs</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <Button variant="outline" className="rounded-2xl border-2 font-black gap-2 h-12 uppercase text-[10px]">
              <LockIcon size={16} /> Verrouiller
            </Button>
          </div>
        </div>
      </div>

      {/* ZONE DES TICKETS */}
      <ScrollArea className="flex-1">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={cn(
                "rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 overflow-hidden shadow-sm transition-all",
                ticket.status === 'preparing' ? "border-orange-500 shadow-orange-500/10" : "border-white dark:border-slate-800"
              )}
            >
              {/* Ticket Header */}
              <div className={cn(
                "p-5 flex justify-between items-start",
                ticket.status === 'preparing' ? "bg-orange-500/5" : "bg-slate-50/50 dark:bg-slate-800/50"
              )}>
                <div>
                  <h3 className="font-black text-2xl italic tracking-tighter leading-none">{ticket.table}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{ticket.reference}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="rounded-lg font-black uppercase text-[9px] py-1 border-2">
                    <Timer size={10} className="mr-1" /> {ticket.createdAt}
                  </Badge>
                </div>
              </div>

              {/* Ticket Items */}
              <div className="p-5 space-y-4">
                {ticket.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-primary shrink-0">
                      {item.qty}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm uppercase leading-tight">{item.name}</p>
                      {item.modifiers?.map((mod: any, midx: any) => (
                        <span key={midx} className="text-[10px] font-bold text-orange-600 block">
                          +{mod.quantity}x{mod.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30">
                {ticket.status === 'pending' ? (
                  // État 1 : En attente -> Passer en préparation
                  <Button
                    onClick={() => handleStatusChange(ticket.id, 'preparing')}
                    className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest gap-2"
                  >
                    <PlayCircle size={16} /> Commencer
                  </Button>
                ) : ticket.status === 'preparing' ? (
                  // État 2 : En préparation -> Passer à Prêt
                  <Button
                    onClick={() => handleStatusChange(ticket.id, 'ready')}
                    className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest gap-2"
                  >
                    <CheckCircle2 size={16} /> Prêt à servir
                  </Button>
                ) : (
                  // État 3 : Prêt -> Bouton désactivé et grisé
                  <Button
                    disabled
                    className="w-full h-12 rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 font-black uppercase text-[10px] tracking-widest gap-2 border-none cursor-not-allowed"
                  >
                    <CheckCircle2 size={16} /> Terminé
                  </Button>
                )}
              </div>
            </div>
          ))}

          {tickets.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-20">
              <ChefHat size={120} className="mb-4 text-slate-400" />
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Cuisine vide</h2>
              <p className="font-bold text-xs uppercase tracking-widest">Tout est sous contrôle à Douala</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}