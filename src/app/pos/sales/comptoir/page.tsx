"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    ChefHat, Loader2, LockIcon, ChevronLeft,
    Timer, CheckCircle2, PlayCircle, Layers, Beer
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import api from "@/src/lib/axios";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import * as kitchenStationApi from "@/src/lib/api/kitchenStation";

// On définit l'interface pour correspondre à notre nouveau Resource Laravel
interface KitchenTicket {
    id: number;
    reference: string;
    table: string;
    status: 'pending' | 'preparing' | 'ready'|  'served';
    createdAt: string;
    roundNumber: number;
    items: Array<{
        id: number;
        name: string;
        qty: number;
        modifiers: Array<{ name: string; quantity: number }>;
    }>;
}

export default function ComptoirPage() {
    const router = useRouter();
    const {on} = useNotifications();
    const queryClient = useQueryClient();

    // 1. Résout la station de type BAR au lieu d'un id codé en dur (qui ne correspondait à
    // rien de réel une fois les stations enfin gérées via /admin/settings). S'il existe
    // plusieurs stations BAR pour la succursale, ce comptoir affiche la première trouvée.
    const { data: barStation, isLoading: isLoadingStation } = useQuery({
        queryKey: ['comptoir-bar-station'],
        queryFn: async () => {
            const stations = await kitchenStationApi.listStations();
            return stations.find((s) => s.type === 'BAR') ?? null;
        },
    });
    const stationId = barStation?.id;

    // 2. Fetch des tickets
    const ticketsQueryKey = ['comptoir-tickets', stationId] as const;
    const {data: tickets = [], isLoading} = useQuery({
        queryKey: ticketsQueryKey,
        queryFn: async () => {
            // GET /api/kitchen/tickets expects `stationId` (camelCase — the Java @RequestParam
            // name), and returns a bare JSON array, not a {data: [...]} envelope.
            const { data } = await api.get(`/api/kitchen/tickets`, {
                params: { stationId }
            });
            return data as KitchenTicket[];
        },
        enabled: !!stationId,
        refetchOnMount: 'always',
    });

    // 3. Écoute temps réel via SSE — payload léger (pas les items), donc on
    // refetch la liste complète plutôt que de tenter de reconstruire un ticket.
    useEffect(() => {
        if (!stationId) return;

        const off = on('ticket.created', (payload) => {
            if (Number(payload?.stationId) !== stationId) return;

            queryClient.invalidateQueries({ queryKey: ticketsQueryKey });
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(() => {});
            toast.info(`Nouveau ticket : Table ${payload?.tableName || 'N/A'}`);
        });

        return off;
    }, [on, stationId]);

    // 4. Mise à jour du statut
    const handleStatusChange = async (ticketId: number, nextStatus: KitchenTicket['status']) => {
        try {
            await api.patch(`/api/kitchen/tickets-direct/${ticketId}/status`, {
                status: nextStatus
            });

            queryClient.setQueryData<KitchenTicket[]>(ticketsQueryKey, (prev = []) => {
                if (nextStatus === 'served') {
                    return prev.filter(t => t.id !== ticketId);
                }
                return prev.map(t => t.id === ticketId ? { ...t, status: nextStatus } : t);
            });
            // Ce patch ne touche que le cache local des tickets comptoir — sans ça, l'écran
            // Vente (PosSalesPage) affichait un statut périmé en y naviguant juste après une
            // action ici (même cause que le fix sur PosContent.tsx#handleRequestBilling).
            queryClient.invalidateQueries({ queryKey: ['pos-sales-orders'] });

            if (nextStatus === 'served') {
                toast.success("Commande prête à servir !");
            }
        } catch (error) {
            toast.error("Action impossible");
        }
    };
    if (isLoadingStation) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="animate-spin text-white/40 h-10 w-10" />
            </div>
        );
    }

    if (!stationId) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white">
                <ChefHat className="text-primary opacity-20" size={80} />
                <h2 className="font-black uppercase italic tracking-widest text-sm">Aucune station de type Bar configurée</h2>
                <p className="text-white/40 text-xs max-w-sm text-center">
                    Créez ou assignez une station de type "Bar" dans Réglages pour activer cet écran.
                </p>
                <Button variant="outline" onClick={() => router.push('/admin/settings')} className="rounded-full">
                    Aller aux réglages
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
            {/* HEADER */}
            <div className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800 z-20 shadow-xl shadow-slate-200/20">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-black text-2xl uppercase italic tracking-tighter">Comptoir </h1>
                                <Badge className="bg-primary/10 text-primary border-none font-black px-3">
                                    Bar
                                </Badge>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Monitoring en temps réel
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-2 rounded-2xl flex flex-col items-center">
                            <span className="text-xl font-black text-primary leading-none">{tickets.length}</span>
                            <span className="text-[8px] font-black uppercase opacity-50 tracking-tighter">En attente</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TICKETS GRID */}
            <ScrollArea className="flex-1">
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 items-start">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className={cn(
                                "group rounded-[3rem] bg-white dark:bg-slate-900 border-2 transition-all duration-300 shadow-sm overflow-hidden",
                                ticket.status === 'preparing'
                                    ? "border-orange-500 ring-4 ring-orange-500/5 translate-y-[-4px]"
                                    : "border-transparent"
                            )}
                        >
                            {/* Header du ticket */}
                            <div className={cn(
                                "p-6 flex justify-between items-start",
                                ticket.status === 'preparing' ? "bg-orange-50" : "bg-slate-50/50"
                            )}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Layers size={14} className="text-primary" />
                                        <span className="font-black text-xs text-primary uppercase italic">ROUND {ticket.roundNumber}</span>
                                    </div>
                                    <h3 className="font-black text-3xl italic tracking-tighter leading-none">{ticket.table}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">REF: {ticket.reference}</p>
                                </div>
                                <Badge variant="outline" className="rounded-xl font-black border-2 px-3 py-1 bg-white">
                                    <Timer size={12} className="mr-2 text-primary" /> {ticket.createdAt}
                                </Badge>
                            </div>

                            {/* Liste des articles */}
                            <div className="p-6 space-y-5 min-h-[150px]">
                                {ticket.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="h-8 w-8 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-sm shrink-0">
                                            {item.qty}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-md uppercase leading-tight tracking-tight">{item.name}</p>
                                            {item.modifiers?.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {item.modifiers.map((mod, midx) => (
                                                        <span key={midx} className="text-[10px] font-black px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md uppercase">
                                                            + {mod.name} ({mod.quantity})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pied de ticket avec actions */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                                {ticket.status === 'pending' ? (
                                    <Button
                                        onClick={() => handleStatusChange(ticket.id, 'preparing')}
                                        className="w-full h-14 rounded-[1.5rem] bg-slate-900 hover:bg-primary text-white font-black uppercase text-xs tracking-widest gap-3 transition-all"
                                    >
                                        <PlayCircle size={20} /> Commencer
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleStatusChange(ticket.id, 'served')}
                                        className="w-full h-14 rounded-[1.5rem] bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-widest gap-3 animate-pulse shadow-lg shadow-orange-500/20"
                                    >
                                        <CheckCircle2 size={20} /> Terminer
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* EMPTY STATE */}
                    {tickets.length === 0 && !isLoading && (
                        <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-30">
                            <div className="h-32 w-32 rounded-[3rem] bg-slate-200 flex items-center justify-center mb-6">
                                <Beer size={60} />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Tout est prêt !</h2>
                            <p className="font-bold text-xs uppercase tracking-[0.3em] mt-2">Aucun ticket en attente pour le moment</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}