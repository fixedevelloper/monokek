'use client'
import React, { useCallback, useEffect, useState } from 'react';
import {
    Calendar as CalendarIcon, Eye, Loader2, ReceiptText,
    Search, X, Table2, User, Clock, Hash, ChefHat, CreditCard
} from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order } from '@/src/types/menus';
import api from '@/src/lib/axios';
import { useQuery } from '@tanstack/react-query';
// ── Badge statut ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    paid:            { label: 'Payé',      className: 'bg-emerald-100 text-emerald-700' },
    completed:       { label: 'Terminé',   className: 'bg-blue-100 text-blue-700' },
    pending_payment: { label: 'Attente',   className: 'bg-amber-100 text-amber-700' },
    cancelled:       { label: 'Annulé',    className: 'bg-red-100 text-red-700' },
    pending:         { label: 'En cours',  className: 'bg-violet-100 text-violet-700' },
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${config.className}`}>
            {config.label}
        </span>
    );
}

// ── Modal détail commande ─────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
    const o        = order as any;
    const rounds   = o.rounds   ?? [];
    const payments = o.payments ?? [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* ── En-tête ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            Détail de la commande
                        </p>
                        <h2 className="text-lg font-black italic tracking-tight text-slate-900">
                            {o.reference}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Corps scrollable ── */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">

                    {/* Infos générales */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Table2,      label: 'Table',   value: o.table?.name || 'Emporté' },
                            { icon: Clock,       label: 'Date',    value: `${o.date} à ${o.created_at}` },
                            { icon: User,        label: 'Serveur', value: o.waiter?.name || 'N/A' },
                            { icon: Hash,        label: 'Type',    value: o.type === 'dinein' ? 'Sur place' : o.type },
                            { icon: ReceiptText, label: 'Statut',  value: null, badge: o.status },
                            { icon: Table2,      label: 'Places',  value: o.table?.seats ? `${o.table.seats} places` : 'N/A' },
                        ].map(({ icon: Icon, label, value, badge }) => (
                            <div key={label} className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                                <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{label}</p>
                                    {badge
                                        ? <StatusBadge status={badge} />
                                        : <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Rounds / Services ── */}
                    {rounds.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <ChefHat className="w-3.5 h-3.5" />
                                Services ({rounds.length})
                            </p>

                            {rounds.map((round: any, idx: number) => {
                                const items = round.items ?? [];
                                if (items.length === 0) return null;

                                return (
                                    <div key={round.id ?? idx} className="border border-slate-100 rounded-xl overflow-hidden">

                                        {/* Header round */}
                                        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                                    Service #{round.round_number ?? idx + 1}
                                                </span>
                                                {round.sent_at && (
                                                    <span className="text-[9px] text-slate-400 font-medium">
                                                        · envoyé à {round.sent_at.slice(11, 16)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400">
                                                    {items.length} article{items.length > 1 ? 's' : ''}
                                                </span>
                                                <StatusBadge status={round.status} />
                                            </div>
                                        </div>

                                        {/* Lignes articles */}
                                        <div className="divide-y divide-slate-50">
                                            {items.map((item: any, iIdx: number) => (
                                                <div key={item.id ?? iIdx} className="px-4 py-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-start gap-2 min-w-0">
                                                            <span className="shrink-0 h-5 w-5 rounded-md bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">
                                                                {item.qty}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-800 truncate">
                                                                    {item.product?.name || 'Produit inconnu'}
                                                                </p>
                                                                {(item.modifiers ?? []).map((m: any, mIdx: number) => (
                                                                    <p key={mIdx} className="text-[10px] text-slate-400 italic">
                                                                        + {m.modifier_item?.name}
                                                                    </p>
                                                                ))}
                                                                {item.note && (
                                                                    <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                                                                        📝 {item.note}
                                                                    </p>
                                                                )}
                                                                <StatusBadge status={item.status} />
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs font-black text-slate-900">
                                                                {item.formatted_total}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {item.price} × {item.qty}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Sous-total round */}
                                        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-t border-slate-100">
                                            <span className="text-[10px] font-black uppercase text-slate-400">
                                                Sous-total service
                                            </span>
                                            <span className="text-xs font-black text-slate-700">
                                                {round.total_round?.toLocaleString('fr-FR')} FCFA
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 text-center py-4">Aucun service enregistré</p>
                    )}

                    {/* ── Paiements ── */}
                    {payments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5" /> Règlements
                            </p>
                            <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 overflow-hidden">
                                {payments.map((payment: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                                        <span className="text-xs font-bold text-slate-600">
                                            {payment.payment_method?.name || payment.payment_method_name || 'Espèces'}
                                        </span>
                                        <span className="text-xs font-black text-slate-900">
                                            {payment.amount?.toLocaleString('fr-FR')} FCFA
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Note globale commande */}
                    {o.note && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                            <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider mb-1">Note</p>
                            <p className="text-xs text-amber-800 font-medium">{o.note}</p>
                        </div>
                    )}
                </div>

                {/* ── Pied modal : total ── */}
                <div className="shrink-0 border-t px-6 py-4 flex items-center justify-between bg-slate-50">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Total</p>
                        {o.amounts?.discount > 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold">
                                Remise : -{o.amounts.discount?.toLocaleString('fr-FR')} FCFA
                            </p>
                        )}
                    </div>
                    <span className="text-xl font-black text-slate-900">
                        {o.amounts?.formatted_total}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ── Page principale ───────────────────────────────────────────────────────────
// ── Fetcher (hors composant, référence stable) ────────────────────────────────
const fetchOrders = async (
    date: Date | undefined,
    search: string,
    status: string
): Promise<Order[]> => {
    const params = new URLSearchParams({
        date:   date ? format(date, 'yyyy-MM-dd') : '',
        search,
        status,
    });
    const res = await api.get(`/api/pos/orders?${params.toString()}`);
    return res.data.data;
};

export default function HistoryPage() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // ── Filtres ───────────────────────────────────────────────────────────────
    const [date, setDate]           = useState<Date | undefined>(new Date());
    const [searchInput, setSearchInput] = useState("");       // valeur brute de l'input
    const [search, setSearch]           = useState("");       // valeur debouncée → queryKey
    const [status, setStatus]           = useState("all");

    // Debounce 300ms sur la recherche texte
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    // ── Query ─────────────────────────────────────────────────────────────────
    const { data: orders = [], isLoading, isFetching, isError } = useQuery({
        queryKey:        ['pos-orders', date, search, status],
        queryFn:         () => fetchOrders(date, search, status),
        placeholderData: (prev) => prev,   // garde les résultats précédents → pas de flash vide
        staleTime:       30_000,           // 30s avant refetch arrière-plan
    });

    // isLoading = premier chargement (pas de données en cache)
    // isFetching = chargement en arrière-plan (données précédentes affichées)
    const showOverlay = isLoading || isFetching;

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
                        {isLoading ? '...' : `${orders.length} Commande(s) trouvée(s)`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Recherche */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Référence ou Table..."
                            className="pl-9 rounded-xl border-slate-200"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>

                    {/* Date */}
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

                    {/* Statut */}
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

            {/* Erreur */}
            {isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-3 rounded-xl">
                    ⚠️ Impossible de charger les commandes. Vérifiez votre connexion.
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex-1 relative">

                {/* Overlay de chargement (premier load + refetch) */}
                {showOverlay && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                <div className="overflow-auto h-[calc(100vh-250px)]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                        <tr>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500">Référence</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500">Heure</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500">Table</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500">Serveur</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500">Statut</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500">Montant</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {orders.length > 0 ? orders.map((order) => (
                            <tr
                                key={order.id}
                                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedOrder(order)}
                            >
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-black italic text-sm text-slate-900">{order.reference}</span>
                                        <span className="text-[9px] uppercase font-bold text-muted-foreground">{order.type}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-xs font-bold text-slate-600">
                                    {order.created_at}
                                </td>
                                <td className="p-4 text-xs">
                                        <span className="bg-slate-100 px-2 py-1 rounded font-black uppercase">
                                            {(order as any).table?.name || "EMPORTÉ"}
                                        </span>
                                </td>
                                <td className="p-4 text-xs font-medium text-slate-500">
                                    {(order as any).waiter?.name || "N/A"}
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={order.status} />
                                </td>
                                <td className="p-4">
                                        <span className="font-black text-sm text-slate-900">
                                            {order.amounts.formatted_total}
                                        </span>
                                </td>
                                <td className="p-4 text-right">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="rounded-full hover:bg-primary/10 hover:text-primary"
                                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        )) : !isLoading && (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-muted-foreground font-bold uppercase text-xs">
                                    Aucune commande trouvée
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal détail */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}