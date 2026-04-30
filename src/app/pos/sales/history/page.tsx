

'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar as CalendarIcon, ReceiptText, Loader2, Eye } from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Tes imports UI...
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order } from '@/src/types/menus';
import api from '@/src/lib/axios';

export default function HistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filtres
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            // On envoie les filtres en query params
            const params = new URLSearchParams({
                date: date ? format(date, 'yyyy-MM-dd') : '',
                search: search,
                status: status
            });
            
            const res = await api.get(`/api/pos/orders?${params.toString()}`);
            setOrders(res.data.data);
        } catch (error) {
            console.error("Erreur historique:", error);
        } finally {
            setLoading(false);
        }
    }, [date, search, status]); // Re-déclenche si l'un d'eux change

    useEffect(() => {
        // Debounce simple pour la recherche
        const timeout = setTimeout(() => {
            fetchOrders();
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchOrders]);

    return (
        <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6">
            {/* Header & Filtres */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
                <div>
                    <h1 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
                        <ReceiptText className="w-6 h-6 text-primary" />
                        Historique des Ventes
                    </h1>
                    <p className="text-xs text-muted-foreground font-bold uppercase mt-1">
                        {orders.length} Commande(s) trouvée(s)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Référence ou Table..." 
                            className="pl-9 rounded-xl border-slate-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs uppercase h-10">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: fr }) : "Date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>

                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[140px] rounded-xl border-slate-200 font-bold text-xs uppercase h-10">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="paid">Payés</SelectItem>
                            <SelectItem value="pending_payment">Attente</SelectItem>
                            <SelectItem value="cancelled">Annulés</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex-1 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                <div className="overflow-auto h-[calc(100vh-250px)]">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Référence</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Heure</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Table</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Serveur</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Montant</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.length > 0 ? orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-black italic text-sm text-slate-900">{order.reference}</span>
                                            <span className="text-[9px] uppercase font-bold text-muted-foreground">{order.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-600">{order.created_at}</td>
                                    <td className="p-4 text-xs">
                                        <span className="bg-slate-100 px-2 py-1 rounded font-black uppercase">
                                            {order.table?.name || "EMPORTÉ"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-medium text-slate-500">{order.waiter?.name || "N/A"}</td>
                                    <td className="p-4">
                                        <span className="font-black text-sm text-slate-900">{order.amounts.formatted_total}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-muted-foreground font-bold uppercase text-xs">
                                        Aucune commande trouvée
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}