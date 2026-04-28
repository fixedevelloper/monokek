"use client";

import React, { useEffect, useState } from 'react';
import {
    Search,
    Printer,
    RotateCcw,
    History,
    Filter,
    CheckCircle2,
    Clock,
    XCircle,
    ReceiptText,
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/src/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/src/types/menus';
import api from '@/src/lib/axios';
import { useUIStore } from '@/src/store/use-ui-store';
import { toast } from 'sonner';
import { usePrint } from '@/src/hooks/use-print';
import { useCashStore } from '@/src/store/use-cash-store';
import CashOpenModal from '../CashOpenModal';
import { useRouter } from 'next/navigation';
import CashReportTicket from '../CashReportTicket';

export default function PosSalesPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSale, setSelectedSale] = useState<Order | null>(null);
    const { openPayment } = useUIStore();
    const [isClosing, setIsClosing] = useState(false);
    const [closingAmount, setClosingAmount] = useState("");
    const [note, setNote] = useState("");
    const { printReceipt } = usePrint();
    const [showReport, setShowReport] = useState(false);
    const [lastReport, setLastReport] = useState(null);
    const router = useRouter();
    const { isOpen } = useCashStore();

    const [previewData, setPreviewData] = useState<any>(null);

    const handlePreviewCloture = async () => {
        setLoading(true);
        try {
            // On récupère l'état actuel de la caisse SANS fermer
            const response = await api.get('api/cash/current-summary');

            // On stocke les données pour les afficher dans le modal
            setPreviewData(response.data);
            setIsClosing(true); // Ouvre le modal de saisie
        } catch (error) {
            toast.error("Impossible de récupérer le résumé de caisse");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/pos/orders/history"); // Endpoint history qu'on a créé
            setOrders(res.data.data);
        } catch (error) {
            console.error("Erreur historique:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
        draft: { label: "Brouillon", color: "bg-slate-100 text-slate-600" },
        pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
        pending_payment: { label: "Attente Paiement", color: "bg-orange-100 text-orange-700" },
        billing: { label: "Facturation", color: "bg-blue-100 text-blue-700" },
        paid: { label: "Payé", color: "bg-emerald-100 text-emerald-700" },
        completed: { label: "Terminé", color: "bg-green-100 text-green-700" },
        cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" },
    };



    // 2. Filtrage dynamique (Recherche par référence ou montant)
    const filteredOrders = orders.filter(order =>
        order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.amounts.total.toString().includes(searchTerm)
    );
    const handleCloseShift = async () => {
        // 1. Validation de base
        if (!closingAmount || isNaN(parseFloat(closingAmount))) {
            toast.error("Veuillez saisir un montant de clôture valide");
            return;
        }

        setLoading(true); // Si tu as un état de chargement pour le bouton

        try {
            // 2. Appel à l'API Laravel

            const response = await api.get('api/cash/current-summary');

            // 3. Mise à jour des états pour afficher le ticket virtuel
            setLastReport(response.data.report);
            setShowReport(true);

            // 4. Fermer le modal de saisie
            setIsClosing(false);

            toast.success("Session de caisse clôturée avec succès");

            // 5. Optionnel : On peut vider le store ici ou attendre que l'utilisateur 
            // ferme le ticket virtuel (mieux pour l'UX)
            // useCashStore.getState().closeSession();

        } catch (error: any) {
            console.error("Erreur clôture:", error);
            const message = error.response?.data?.message || "Erreur lors de la clôture de la caisse";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async (selectedSale: any) => {
        if (!selectedSale) {
            toast.error("Aucune vente sélectionnée pour l'impression");
            return;
        }

        try {

            // 1. Préparation des données pour le format thermique (ESC/POS)
            // On s'assure que la structure correspond au OrderPayload de Rust
            const printData = {
                // Référence de la commande (ex: CMD-HSEMJYWO)
                reference: selectedSale.reference,

                // Client (Pas de champ customer dans ton JSON, donc "Client Passant")
                customer_name: selectedSale.customer?.name || "Client Passant",

                // Date et Heure (On combine la date et created_at du JSON)
                date: `${selectedSale.date} à ${selectedSale.created_at}`,

                // On récupère le total dans l'objet "amounts"
                total: parseFloat(selectedSale.amounts.total),

                // On traite les articles
                items: selectedSale.items.map((item: any) => {
                    // On crée le nom avec les modifiers (ex: Poisson Braisé + Alloco, Frites)
                    const modifiersList = item.modifiers && item.modifiers.length > 0
                        ? ` (${item.modifiers.map((m: any) => m.name).join(', ')})`
                        : '';

                    return {
                        name: `${item.product?.name}${modifiersList}`,
                        qty: parseInt(item.qty),
                        price: parseFloat(item.price)
                    };
                }),

                // Optionnel : ajouter le serveur et la table pour le ticket
                waiter_name: selectedSale.waiter?.name,
                table_name: selectedSale.table?.name
            };

            // Envoi vers le Rust
            await printReceipt(printData);

        } catch (error) {
            console.error("Erreur lors de la préparation de l'impression:", error);
            toast.error("Impossible de générer le ticket de caisse");
        }
    };
    const handleCloseShift2 = async () => {
        try {
            const response = await api.post('api/cash/close', {
                closing_amount: parseFloat(closingAmount),
                note: note
            });

            // 1. On affiche le rapport de clôture (X-Report)
            console.log("Rapport de clôture:", response.data.report);
            toast.success("Shift clôturé avec succès !");

            // 2. Optionnel : On imprime automatiquement le ticket de fin de shift
            // handlePrintReport(response.data.report);

            // 3. On réinitialise le Store de caisse pour bloquer les ventes
            useCashStore.getState().closeSession();

            setIsClosing(false);
            router.push('/login');
        } catch (error) {
            toast.error("Erreur lors de la clôture de la caisse");
        }
    };
    const confirmFinalClose = async () => {
        try {
            const response = await api.post('api/cash/close', {
                closing_amount: parseFloat(closingAmount),
                note: note
            });

            // On affiche le ticket final (le rapport officiel avec l'écart calculé)
            setLastReport(response.data.report);
            setShowReport(true);

            // On ferme tout le reste
            setIsClosing(false);
            setPreviewData(null);

            toast.success("Shift terminé et enregistré");
            useCashStore.getState().closeSession();
        } catch (error) {
            toast.error("Erreur lors de la validation finale");
        }
    };
    if (!isOpen) {
        return <CashOpenModal />;
    }
    return (
        <div className="flex flex-col h-full w-full bg-muted/20">
            {/* Top Bar : Identique mais fonctionnelle */}
            <div className="p-4 bg-card border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <h1 className="font-black uppercase tracking-tight italic">Historique du Shift</h1>
                </div>
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une référence (ex: CMD-XXXX)..."
                        className="pl-10 h-11 bg-muted/50 border-none font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Liste des ventes (Gauche) */}
                <div className="w-full md:w-[450px] border-r bg-card flex flex-col">
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                            {loading ? (
                                <p className="text-center p-8 font-black animate-pulse text-muted-foreground uppercase text-xs">Chargement des tickets...</p>
                            ) : filteredOrders.map((order) => (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedSale(order)}
                                    className={cn(
                                        "p-5 rounded-[2rem] border-2 cursor-pointer transition-all hover:border-primary/30",
                                        order.status === 'cancelled' ? "bg-red-50/30 border-red-100 opacity-60" : "bg-white border-slate-50 shadow-sm",
                                        selectedSale?.uuid === order.uuid && "border-primary bg-primary/[0.02] ring-1 ring-primary"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 tracking-tighter italic">{order.reference}</span>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
                                                {order.date} • {order.created_at}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-slate-900">{order.amounts.formatted_total}</p>
                                            <Badge
                                                className={cn(
                                                    "px-3 py-1 rounded-full font-black uppercase text-[10px] border-none shadow-sm",
                                                    STATUS_CONFIG[order.status].color
                                                )}
                                            >
                                                {STATUS_CONFIG[order.status].label}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Détails du Ticket (Droite) */}
                <div className="hidden md:flex flex-1 flex-col bg-card border-l overflow-hidden">
                    {!selectedSale ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center">
                                <ReceiptText className="h-10 w-10 text-slate-200" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Sélectionnez un ticket</h3>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col p-10 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <Badge variant="outline" className="mb-3 font-black tracking-widest px-3 py-1 rounded-full">{selectedSale.reference}</Badge>
                                    <h2 className="text-6xl font-black tracking-tighter italic">{selectedSale.amounts.formatted_total}</h2>
                                    <div className="flex gap-4 mt-2">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase">Servi par: <span className="text-primary">{selectedSale.waiter?.name}</span></p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase">Table: <span className="text-primary">{selectedSale.table?.name || 'Emporter'}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* LISTE RÉELLE DES ARTICLES */}
                            <div className="flex-1 bg-slate-50/50 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200 mb-8 overflow-y-auto">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Détails de la commande</p>
                                <div className="space-y-6">
                                    {selectedSale.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center group">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 text-sm">{item.qty}x {item.product.name}</span>
                                                {item.modifiers?.map(m => (
                                                    <span key={m.id} className="text-[10px] text-primary font-bold uppercase tracking-tighter">+ {m.name}</span>
                                                ))}
                                            </div>
                                            <span className="font-black text-slate-900">{formatCurrency(item.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">

                                {selectedSale.status === 'pending_payment' && (
                                    <Button
                                        className="h-20 w-full flex items-center justify-center gap-3 rounded-3xl shadow-2xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95 animate-in slide-in-from-top-2 duration-300"
                                        // On passe l'objet selectedSale complet au modal pour qu'il ait le montant et les items
                                        onClick={() => openPayment(selectedSale)}
                                    >
                                        <div className="bg-white/20 p-2 rounded-xl">
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1">
                                                Paiement en attente
                                            </span>
                                            <span className="text-sm font-black uppercase tracking-widest leading-none">
                                                Encaisser {formatCurrency(selectedSale.amounts.total)}
                                            </span>
                                        </div>
                                    </Button>
                                )}

                                {/* Grille d'actions secondaires */}
                                <div className="grid grid-cols-2 gap-6">
                                    <Button
                                        className="h-20 flex flex-col gap-1 rounded-3xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
                                        onClick={() =>
                                            handlePrint(selectedSale)

                                        }
                                    >
                                        <Printer className="h-6 w-6" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Imprimer Facture</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        disabled={selectedSale.status === 'cancelled' || selectedSale.status === 'paid'}
                                        className="h-20 flex flex-col gap-1 rounded-3xl border-2 border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                                    /*   onClick={() => handleCancel(selectedSale.id)} */
                                    >
                                        <RotateCcw className="h-6 w-6" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Annuler Ticket</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Session : Calculé dynamiquement */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center rounded-t-[2.5rem] shadow-2xl">
                <div className="flex gap-12">
                    <div>
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Total du shift</p>
                        <p className="text-3xl font-black italic">{formatCurrency(orders.reduce((acc, curr) => acc + curr.amounts.total, 0))} FCFA</p>
                    </div>
                    <div className="hidden sm:block border-l border-white/10 pl-12">
                        <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Tickets validés</p>
                        <p className="text-3xl font-black italic">{orders.length}</p>
                    </div>
                </div>
                <Button
                    onClick={() =>

                        handlePreviewCloture()
                    }
                    className="bg-white text-slate-900 hover:bg-emerald-500 hover:text-white px-8 h-14 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                    Clôturer Shift
                </Button>
            </div>
            {isClosing && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <Card className="max-w-md w-full rounded-[2.5rem] shadow-2xl border-none">
                        <CardContent className="p-10 space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-serif font-bold italic">Clôturer le Shift</h2>
                                <p className="text-sm text-stone-500">Comptez l'argent en caisse (Cash + MoMo + Orange)</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-2">Montant Réel (FCFA)</label>
                                    <Input
                                        type="number"
                                        value={closingAmount}
                                        onChange={(e) => setClosingAmount(e.target.value)}
                                        placeholder="Ex: 150000"
                                        className="h-16 rounded-2xl bg-stone-50 border-none text-2xl font-mono font-bold"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-2">Note / Observations</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full rounded-2xl bg-stone-50 border-none p-4 text-sm focus:ring-0 min-h-[100px]"
                                        placeholder="Raison d'un écart, problème technique..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setIsClosing(false)}
                                    className="flex-1 h-14 rounded-2xl bg-stone-100 text-stone-600 hover:bg-stone-200 font-bold"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleCloseShift}
                                    disabled={!closingAmount}
                                    className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 font-black uppercase tracking-wider"
                                >
                                    Confirmer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* Le Ticket Virtuel */}
            {showReport && lastReport && (
                <CashReportTicket
                    data={lastReport}
                    onClose={() => {
                        setShowReport(false);
                        useCashStore.getState().closeSession();
                    }}
                    onPrint={() => {
                        // Appelle ici ta fonction Rust de Tauri pour imprimer le texte brut
                        // handlePrintESC(lastReport);
                    }}
                />
            )}
            {isClosing && previewData && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <Card className="max-w-md w-full rounded-[2.5rem] shadow-2xl border-none">
                        <CardContent className="p-10 space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-serif font-bold italic">Vérification de Caisse</h2>
                                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Résumé des ventes du système</p>
                            </div>

                            {/* --- ÉTAPE A : AFFICHAGE DU RÉSUMÉ --- */}
                            <div className="bg-stone-50 rounded-2xl p-4 space-y-2 border border-stone-100 font-mono text-sm">
                                {previewData.payments_detail.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between">
                                        <span className="text-stone-500">{p.name}</span>
                                        <span className="font-bold">{Number(p.total).toLocaleString()} F</span>
                                    </div>
                                ))}
                                <div className="flex justify-between border-t border-stone-200 pt-2 font-black text-stone-900">
                                    <span>TOTAL VENTES</span>
                                    <span>{Number(previewData.total_sales).toLocaleString()} F</span>
                                </div>
                            </div>

                            {/* --- ÉTAPE B : SAISIE DU RÉEL --- */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-2">Argent Réel en Caisse (FCFA)</label>
                                    <Input
                                        type="number"
                                        value={closingAmount}
                                        onChange={(e) => setClosingAmount(e.target.value)}
                                        placeholder="Saisissez le montant compté"
                                        className="h-16 rounded-2xl bg-stone-50 border-none text-2xl font-mono font-bold text-emerald-600"
                                    />
                                </div>

                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Notes ou explications sur d'éventuels écarts..."
                                    className="w-full rounded-2xl bg-stone-50 border-none p-4 text-sm focus:ring-0 min-h-[80px]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={() => setIsClosing(false)} className="flex-1 h-14 rounded-2xl bg-stone-100 text-stone-600 font-bold">
                                    Annuler
                                </Button>
                                <Button
                                    onClick={confirmFinalClose}
                                    className="flex-1 h-14 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-wider"
                                >
                                    Clôturer Définitivement
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}