"use client";

import React, { useState } from "react";
import {
    FileSpreadsheet, FileText, Download, Calendar,
    TrendingUp, Wallet, ArrowUpRight, ShieldCheck, Loader2, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {useRouter} from "next/navigation";
import api from "../../../lib/axios";

export default function AccountingPage() {
    const router = useRouter();
    // Période par défaut : Mois en cours
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    const [downloadingType, setDownloadingType] = useState<string | null>(null);


    const handleExport = async (endpoint: string, fileType: 'excel' | 'pdf', reportName: string) => {
        const loadingKey = `${endpoint}-${fileType}`;
        setDownloadingType(loadingKey);

        try {
            // On demande un blob (Binary Large Object) pour intercepter le fichier brut envoyé par Laravel
            const response = await api.get(`/api/accounting/${endpoint}`, {
                params: { start_date: startDate, end_date: endDate, format: fileType },
                responseType: 'blob'
            });

            // Création du lien de téléchargement automatique dans le navigateur
            const blob = new Blob([response.data], {
                type: fileType === 'excel'
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : 'application/pdf'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Extension du fichier (.xlsx ou .pdf)
            const extension = fileType === 'excel' ? 'xlsx' : 'pdf';
            link.setAttribute('download', `rapport_${reportName}_${startDate}_au_${endDate}.${extension}`);

            document.body.appendChild(link);
            link.click();

            // Nettoyage du DOM
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`Rapport exporté avec succès !`);
        } catch (error) {
            console.error("Erreur d'export comptable:", error);
            toast.error("Échec de la génération du rapport. Vérifiez les données.");
        } finally {
            setDownloadingType(null);
        }
    };

    const reports = [
        {
            id: "sales-summary",
            endpoint: "sales-summary",
            title: "1. Journal Général des Ventes",
            description: "Z de caisse cumulé jour par jour. Idéal pour passer l'écriture de vente globale (Date, CA Brut TTC, TVA, CA Net HT).",
        },
        {
            id: "payment-methods",
            endpoint: "payments-breakdown",
            title: "2. Rapport des Règlements (Modes de Paiement)",
            description: "Ventilation des encaissements journaliers (Espèces, Orange Money, MTN MoMo, Tanzack). Crucial pour le rapprochement bancaire.",
        },
        {
            id: "detailed-vouchers",
            endpoint: "detailed-sales",
            title: "3. Journal Détaillé des Factures",
            description: "Liste unitaire ligne par ligne de toutes les commandes closes et payées avec leur référence unique pour l'audit.",
        },
        {
            id: "categories-breakdown",
            endpoint: "categories-sales",
            title: "4. Ventes par Catégorie de Produits",
            description: "Répartition du chiffre d'affaires par pôle d'activité (Cuisine, Bar, Chicha) pour la ventilation dans les comptes de classe 7.",
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-8 space-y-8">

            {/* --- EN-TÊTE DE PAGE --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    {/* --- BOUTON RETOUR --- */}
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="h-12 w-12 rounded-full border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 p-0 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </Button>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Espace Comptabilité</h1>
                            <Badge className="bg-blue-500/10 text-blue-600 border-none font-black px-3 py-1 flex items-center gap-1">
                                <ShieldCheck size={12} /> Conforme OHADA
                            </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Génération et extraction des journaux financiers pour votre expert-comptable
                        </p>
                    </div>
                </div>

                {/* --- FILTRE DE PÉRIODE --- */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/60 shrink-0">
                    <Calendar size={18} className="text-slate-400 ml-1" />
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent font-black text-xs text-slate-700 dark:text-white uppercase focus:outline-none cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Au</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent font-black text-xs text-slate-700 dark:text-white uppercase focus:outline-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* --- RAPPELS DE SÉCURITÉ / COMPTABILITÉ --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-6 flex gap-4 items-center">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-tight text-emerald-800 dark:text-emerald-400">Ventes Clôturées</h4>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Seules les commandes au statut <span className="font-bold text-emerald-600">Payé</span> sont intégrées dans ces journaux.</p>
                    </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-6 flex gap-4 items-center">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <Wallet size={22} />
                    </div>
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-tight text-amber-800 dark:text-amber-400">Rapprochement Mobile Money</h4>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Les montants OM et MoMo intègrent les ID de transaction pour faciliter le lettrage bancaire.</p>
                    </div>
                </div>

                <div className="bg-slate-900 text-slate-200 rounded-[2rem] p-6 flex gap-4 items-center justify-between">
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-tight text-white italic">Besoin d'un format spécifique ?</h4>
                        <p className="text-[11px] opacity-60 mt-1">Les exports Excel générés sont directement compatibles avec Sage Co et Odoo.</p>
                    </div>
                    <ArrowUpRight size={24} className="text-primary shrink-0 opacity-50" />
                </div>
            </div>

            {/* --- GRILLE DES RAPPORTS EXPORTABLES --- */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {reports.map((report) => (
                    <Card key={report.id} className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                                {report.title}
                            </CardTitle>
                            <CardDescription className="text-sm font-medium text-slate-400 leading-relaxed pt-2">
                                {report.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Format d'extraction :</span>

                            <div className="flex gap-3">
                                {/* BOUTON EXCEL / CSV */}
                                <Button
                                    onClick={() => handleExport(report.endpoint, 'excel', report.id)}
                                    disabled={downloadingType !== null}
                                    className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider gap-2 px-5 transition-all"
                                >
                                    {downloadingType === `${report.endpoint}-excel` ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <FileSpreadsheet size={16} />
                                    )}
                                    Excel (.xlsx)
                                </Button>

                                {/* BOUTON PDF */}
                                <Button
                                    onClick={() => handleExport(report.endpoint, 'pdf', report.id)}
                                    disabled={downloadingType !== null}
                                    variant="outline"
                                    className="h-12 rounded-xl border-2 font-black text-xs uppercase tracking-wider gap-2 px-5 transition-all"
                                >
                                    {downloadingType === `${report.endpoint}-pdf` ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <FileText size={16} />
                                    )}
                                    Imprimer PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}