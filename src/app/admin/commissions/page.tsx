"use client";

import React, { useState } from "react";
import {
    Coins,
    ArrowLeft,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    TrendingUp,
    UserCircle2,
    DollarSign, Loader2, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/src/lib/axios";
import { toast } from "sonner";
import {useExport} from "../../../hooks/useExport";

export default function CommissionsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const queryClient = useQueryClient();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Mois actuel (1-12)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const { exportToPDF, isExporting } = useExport();
    const months = [
        { id: 1, name: "Janvier" }, { id: 2, name: "Février" }, { id: 3, name: "Mars" },
        { id: 4, name: "Avril" }, { id: 5, name: "Mai" }, { id: 6, name: "Juin" },
        { id: 7, name: "Juillet" }, { id: 8, name: "Août" }, { id: 9, name: "Septembre" },
        { id: 10, name: "Octobre" }, { id: 11, name: "Novembre" }, { id: 12, name: "Décembre" }
    ];

// 1. Mise à jour du Fetch (On passe les filtres à l'API)
    const { data: commissions, isLoading } = useQuery({
        queryKey: ["commissions", selectedMonth, selectedYear], // Se recharge quand le mois/année change
        queryFn: async () => {
            const res = await api.get('/api/admin/commissions', {
                params: { month: selectedMonth, year: selectedYear }
            });
            return res.data.data;
        }
    });


    // 2. Mutation pour payer un serveur
    const { mutate: settleCommissions } = useMutation({
        mutationFn: async (waiterId: number) => {
            return await api.post(`/api/admin/commissions/settle/${waiterId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["commissions"] });
            toast.success("Paiement enregistré avec succès !");
        }
    });

    // Calculs rapides pour les Stats Cards
    const totalPending = commissions?.filter((c: any) => c.status === 'pending')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

    const handleExport = () => {
        const columns = ["Date", "Serveur", "Type", "Détail", "Montant", "Statut"];
        const data = commissions?.map((c: any) => [
            c.created_at,
            c.waiter_name,
            c.type.toUpperCase(),
            c.product_name,
            `${c.amount.toLocaleString()} F`,
            c.status_label
        ]) || [];

        exportToPDF({
            title: "Rapport des Commissions",
            subtitle: `Période : ${months.find(m => m.id === selectedMonth)?.name} ${selectedYear}`,
            filename: `Commissions_${selectedMonth}_${selectedYear}`,
            columns: columns
        }, data);
    };
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm" asChild>
                        <Link href="/admin"><ArrowLeft size={20}/></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                            Suivi <span className="text-indigo-600">Commissions</span>
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Gestion des primes et performances serveurs
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                        <Input
                            placeholder="Chercher un serveur..."
                            className="pl-10 h-11 w-64 rounded-xl border-none shadow-sm bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 pl-2">
                        <Filter size={16} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Période :</span>
                    </div>

                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-slate-50 border-none rounded-xl text-xs font-bold p-2.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        {months.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-slate-50 border-none rounded-xl text-xs font-bold p-2.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Nouveau bouton d'exportation intégré */}
                <Button
                    onClick={handleExport}
                    disabled={isExporting || !commissions?.length}
                    className="w-full md:w-auto bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center gap-2 h-11 px-6 shadow-lg shadow-slate-200 transition-all active:scale-95"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileText size={18} />
                    )}
                    <span className="text-xs font-black uppercase italic">Exporter le rapport</span>
                </Button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-indigo-600 text-white rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Total à Payer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{totalPending.toLocaleString()} FCFA</div>
                        <p className="text-xs mt-2 opacity-70">Cumul des commissions non réglées</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Top Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="font-black uppercase italic">Moussa Diop</div>
                            <p className="text-[10px] font-bold text-slate-400">125,000 FCFA ce mois</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Status Moyen</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2 text-amber-500">
                        <Clock size={20} />
                        <span className="font-black italic">85% EN ATTENTE</span>
                    </CardContent>
                </Card>
            </div>

            {/* Tableau des Commissions */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                        <th className="p-5 text-[10px] font-black uppercase text-slate-400">Serveur</th>
                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">Type</th>
                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">Produit / Vente</th>
                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-right">Montant</th>
                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">Statut</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {commissions?.map((comm: any) => (
                        <tr key={comm.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <UserCircle2 size={16} />
                                    </div>
                                    <span className="font-bold text-slate-700">{comm.waiter_name}</span>
                                </div>
                            </td>
                            <td className="p-5 text-center">
                                <Badge variant={comm.is_incentive ? "default" : "secondary"} className="rounded-lg px-3 uppercase text-[9px]">
                                    {comm.type}
                                </Badge>
                            </td>
                            <td className="p-5 text-center">
                                <span className="text-xs font-medium text-slate-500 uppercase">{comm.product_name}</span>
                                <p className="text-[9px] text-slate-300 font-bold">{comm.order_reference}</p>
                            </td>
                            <td className="p-5 text-right">
                                <span className="font-black text-indigo-600">{comm.amount.toLocaleString()} F</span>
                            </td>
                            <td className="p-5 text-center">
                                {comm.status === 'paid' ? (
                                    <div className="flex items-center justify-center gap-1 text-emerald-500 font-bold text-[10px] uppercase">
                                        <CheckCircle2 size={14}/> Payé
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-lg text-[10px] font-black uppercase italic border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                                        onClick={() => settleCommissions(comm.waiter_id)}
                                    >
                                        Régler
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}