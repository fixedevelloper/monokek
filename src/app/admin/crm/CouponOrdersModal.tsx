"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import * as orderingApi from "@/src/lib/api/ordering";
import { CouponDto } from "@/src/lib/api/types/crm";
import { Order } from "@/src/types/menus";
import { formatCurrency } from "@/src/lib/formatCurrency";
import { getErrorMessage } from "@/src/lib/errors";

interface CouponOrdersModalProps {
    coupon: CouponDto;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CouponOrdersModal({ coupon, open, onOpenChange }: CouponOrdersModalProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                setLoading(true);
                setOrders(await orderingApi.getOrdersByCoupon(coupon.id));
            } catch (error) {
                toast.error(getErrorMessage(error, "Impossible de charger les commandes de ce coupon"));
            } finally {
                setLoading(false);
            }
        })();
    }, [open, coupon.id]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                        <Ticket className="h-5 w-5 text-primary" />
                        Commandes — Coupon {coupon.code}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">
                        Aucune commande n&apos;a utilisé ce coupon.
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° commande</TableHead>
                                    <TableHead>Date / Heure</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Caissier</TableHead>
                                    <TableHead className="text-right">Montant brut</TableHead>
                                    <TableHead className="text-right">Remise</TableHead>
                                    <TableHead className="text-right">Net payé</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono font-bold">{order.reference}</TableCell>
                                        <TableCell className="text-xs text-slate-500">{order.date} {order.created_at}</TableCell>
                                        <TableCell>{order.customer?.name ?? "Client comptoir"}</TableCell>
                                        <TableCell>{order.cashier?.name ?? "—"}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(order.amounts.subtotal)}</TableCell>
                                        <TableCell className="text-right text-emerald-600">
                                            {order.amounts.discount > 0 ? `- ${formatCurrency(order.amounts.discount)}` : "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-black">{formatCurrency(order.amounts.total)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
