"use client";

import {useEffect, useState} from "react";
import {Sheet, SheetContent, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Award, Coins, Loader2, Minus, Plus} from "lucide-react";
import {toast} from "sonner";
import * as crmApi from "@/src/lib/api/crm";
import {CustomerDto, LoyaltyTransactionDto} from "@/src/lib/api/types/crm";
import {getErrorMessage} from "@/src/lib/errors";

interface CustomerLoyaltySheetProps {
    customer: CustomerDto;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPointsChanged: () => void;
}

export function CustomerLoyaltySheet({ customer, open, onOpenChange, onPointsChanged }: CustomerLoyaltySheetProps) {
    const [transactions, setTransactions] = useState<LoyaltyTransactionDto[]>([]);
    const [currentPoints, setCurrentPoints] = useState(customer.points);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [pointsInput, setPointsInput] = useState("");
    const [submitting, setSubmitting] = useState<"earn" | "redeem" | null>(null);

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            setTransactions(await crmApi.listLoyaltyTransactions(customer.id));
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de charger l'historique de fidélité"));
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (open) {
            setCurrentPoints(customer.points);
            setPointsInput("");
            fetchHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, customer.id]);

    const handlePointsAction = async (action: "earn" | "redeem") => {
        const points = Number(pointsInput);
        if (!points || points < 1) {
            toast.error("Entrez un nombre de points valide");
            return;
        }

        setSubmitting(action);
        try {
            const result = action === "earn"
                ? await crmApi.earnPoints(customer.id, { points })
                : await crmApi.redeemPoints(customer.id, { points });
            setCurrentPoints(result.points);
            setPointsInput("");
            toast.success(action === "earn" ? `${points} points ajoutés` : `${points} points utilisés`);
            onPointsChanged();
            fetchHistory();
        } catch (error) {
            toast.error(getErrorMessage(error, "Opération impossible"));
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[500px] p-0 flex flex-col border-none shadow-2xl">
                <SheetHeader className="p-8 pb-4">
                    <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">
                        Fidélité <span className="text-primary">{customer.name}</span>
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 px-8">
                    <div className="space-y-8 py-4">
                        <div className="rounded-3xl bg-amber-50 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                    <Coins size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-amber-700/70 tracking-widest">Solde actuel</p>
                                    <p className="text-2xl font-black text-amber-700">{currentPoints} points</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400">Ajuster les points</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="Nombre de points"
                                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                    value={pointsInput}
                                    onChange={(e) => setPointsInput(e.target.value)}
                                />
                                <Button
                                    variant="secondary"
                                    className="h-12 rounded-xl font-black uppercase text-[10px] gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none"
                                    disabled={submitting !== null}
                                    onClick={() => handlePointsAction("earn")}
                                >
                                    {submitting === "earn" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Créditer
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-12 rounded-xl font-black uppercase text-[10px] gap-1 bg-red-50 text-red-700 hover:bg-red-100 border-none"
                                    disabled={submitting !== null}
                                    onClick={() => handlePointsAction("redeem")}
                                >
                                    {submitting === "redeem" ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />} Utiliser
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Award size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Historique</span>
                            </div>

                            {loadingHistory ? (
                                <div className="space-y-2 animate-pulse">
                                    {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-2xl" />)}
                                </div>
                            ) : transactions.length === 0 ? (
                                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest py-6 text-center">
                                    Aucun mouvement de points
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                                            <div>
                                                <Badge className={`${tx.type === "earn" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"} border-none uppercase text-[9px] font-black`}>
                                                    {tx.type === "earn" ? "Crédit" : "Débit"}
                                                </Badge>
                                                <p className="text-[10px] text-muted-foreground font-bold mt-1">
                                                    {new Date(tx.createdAt).toLocaleString("fr-FR")}
                                                </p>
                                            </div>
                                            <span className={`text-sm font-black ${tx.type === "earn" ? "text-emerald-600" : "text-red-600"}`}>
                                                {tx.type === "earn" ? "+" : "-"}{tx.points}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
