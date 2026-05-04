'use client'
import React, {useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {ArrowLeft, Clock, Inbox, Loader2, MoreHorizontal, Phone, Plus, Search} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import api from "../../../lib/axios";
import {ReservationSheet} from "./ReservationSheet";
import {formatCurrency} from "../../../lib/formatCurrency";
import {ReservationDetailModal} from "./ReservationDetailModal";
import {toast} from "sonner";
import {window} from "@tauri-apps/api";
import Link from "next/link";


export default function ReservationsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("upcoming");
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedRes, setSelectedRes] = useState<any>(null);

    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [viewingRes, setViewingRes] = useState<any>(null);

    const openDetail = (res: any) => {
        setViewingRes(res);
        setIsDetailOpen(true);
    };

    // Actions
    const openCreate = () => {
        setSelectedRes(null);
        setIsSheetOpen(true);
    };

    const openEdit = (res: any) => {
        setSelectedRes(res);
        setIsSheetOpen(true);
    };
    const handlePayment = async (reservation: any) => {
        // 1. Protection : On ne traite pas si déjà payé
        if (reservation.order?.status === 'paid') return;

        // 2. Confirmation simple
/*        const confirm = window.confirm(
            `Confirmer l'encaissement de ${reservation.order?.amounts.total.toLocaleString()} FCFA pour ${reservation.customer?.name} ?`
        );

        if (!confirm) return;*/

        try {
            setIsSaveLoading(true); // Si tu as un état de loading global ou local

            // 3. Appel API vers le endpoint de checkout
            await api.post(`/api/admin/reservations/${reservation.order.id}/pay`, {
                payment_method: 'cash', // Par défaut ou via un petit sélecteur
                amount_received: reservation.order?.amounts.total
            });

            toast.success("Commande transmise à la caisse !");

            // 4. Rafraîchir les données pour mettre à jour le bouton et le statut
            queryClient.invalidateQueries({ queryKey: ["reservations"] });

            // 5. Fermer le modal de détail si nécessaire
            setIsDetailOpen(false);

        } catch (error: any) {
            toast.error("Impossible de transmettre à la caisse");
        } finally {
            setIsSaveLoading(false);
        }
    };
    // Data : Réservations
    const { data: reservations, isLoading } = useQuery({
        queryKey: ["reservations", filter, searchTerm],
        queryFn: async () => {
            const res = await api.get("/api/admin/reservations", {
                params: { filter, search: searchTerm }
            });
            return res.data.data;
        }
    });

    // Data : Catégories pour le Sheet
    const { data: allCategories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await api.get("/api/admin/categories");
            return res.data.data;
        },
    });

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-transparent mb-8">
                <div className="flex items-center gap-6">
                    {/* BOUTON RETOUR : Plus cohérent avec ton style "Neumorphic/Shadow" */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-14 w-14 rounded-2xl bg-white shadow-xl shadow-slate-200/50 hover:bg-primary hover:text-white transition-all group"
                        asChild
                    >
                        <Link href="/admin">
                            <ArrowLeft size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                            Réservations <span className="text-primary text-outline">Manager</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            Planning des flux et commandes privées
                        </p>
                    </div>
                </div>

                {/* BOUTON ACTION : Ton bouton "Nouvelle Réservation" est parfait tel quel */}
                <Button
                    className="h-16 px-8 rounded-[2rem] font-black text-lg gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
                    onClick={openCreate}
                >
                    <Plus size={24} strokeWidth={3} />
                    NOUVELLE RÉSERVATION
                </Button>
            </div>

            {/* BARRE DE RECHERCHE ET FILTRES */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <Input
                        placeholder="Rechercher un client..."
                        className="pl-12 h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700 placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                    {['today', 'upcoming', 'past'].map((f) => (
                        <Button
                            key={f}
                            variant="ghost"
                            onClick={() => setFilter(f)}
                            className={`rounded-xl font-black uppercase text-[10px] tracking-widest px-6 ${
                                filter === f ? 'bg-white shadow-sm text-primary' : 'text-slate-400'
                            }`}
                        >
                            {f === 'today' ? "Aujourd'hui" : f === 'upcoming' ? "À venir" : "Historique"}
                        </Button>
                    ))}
                </div>
            </div>

            {/* LISTE OU EMPTY STATE */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <p className="font-black uppercase text-slate-300 tracking-tighter">Chargement du planning...</p>
                    </div>
                ) : reservations && reservations.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Client</th>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date & Heure</th>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Commande</th>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {reservations.map((res: any) => (
                            <tr
                                key={res.id}
                                className="cursor-pointer hover:bg-slate-50/50 transition-colors group"
                                onClick={() => openDetail(res)} // Clic sur la ligne pour voir les détails
                            >
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black italic">
                                            {res.customer?.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-sm">{res.customer?.name}</p>
                                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Phone size={10} /> {res.customer?.phone}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-sm font-bold">
                                    <div className="flex flex-col">
                                        <span className="uppercase">{format(new Date(res.pickup_date), "EEEE d MMMM", { locale: fr })}</span>
                                        <span className="text-primary font-black flex items-center gap-1">
                                                <Clock size={14} strokeWidth={3} /> {format(new Date(res.pickup_date), "HH:mm")}
                                            </span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <Badge variant="outline" className="border-2 font-black rounded-xl px-3 py-1">
                                        {formatCurrency(res.order?.amounts.total)}
                                    </Badge>
                                </td>
                                <td className="p-6">
                                    <Badge variant="outline" className="border-2 font-black rounded-xl px-3 py-1">
                                        {res.reservation_status}
                                    </Badge>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="rounded-xl hover:bg-primary hover:text-white transition-all"
                                        onClick={() => openEdit(res)} // ✅ FIX : Fonction anonyme
                                    >
                                        <MoreHorizontal size={20} />
                                    </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    /* EMPTY STATE */
                    <div className="p-32 flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
                            <Inbox size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                            Aucune réservation
                        </h3>
                        <p className="text-slate-400 font-bold max-w-xs mt-2">
                            Il n'y a pas de réservation pour ce filtre ou cette recherche.
                        </p>
                        <Button
                            variant="link"
                            className="mt-4 text-primary font-black uppercase text-xs tracking-widest"
                            onClick={openCreate}
                        >
                            En créer une maintenant ?
                        </Button>
                    </div>
                )}
            </div>

            <ReservationSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                reservation={selectedRes}
                categories={allCategories}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ["reservations"] })}
            />
            <ReservationDetailModal
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                reservation={viewingRes}
                onPayment={handlePayment}
            />
        </div>
    );
}