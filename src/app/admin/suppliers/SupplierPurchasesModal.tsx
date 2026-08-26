"use client";

import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Loader2, Package2, Plus, ShoppingCart} from "lucide-react";
import {toast} from "sonner";
import * as suppliersApi from "@/src/lib/api/suppliers";
import {PurchaseOrderDto, SupplierDto} from "@/src/lib/api/types/suppliers";
import {formatCurrency} from "@/src/lib/formatCurrency";
import {getErrorMessage} from "@/src/lib/errors";
import {AddPurchaseOrderModal} from "./AddPurchaseOrderModal";

export function SupplierPurchasesModal({supplier, open, onOpenChange}: {
    supplier: SupplierDto;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const fetchPurchaseOrders = async () => {
        try {
            setLoading(true);
            setPurchaseOrders(await suppliersApi.listPurchaseOrders(supplier.id));
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de charger les achats"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchPurchaseOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, supplier.id]);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[640px] rounded-[2.5rem] border-none shadow-2xl p-8">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                                Achats — <span className="text-primary">{supplier.name}</span>
                            </DialogTitle>
                            <Button
                                onClick={() => setIsAddOpen(true)}
                                className="h-10 px-4 rounded-xl font-black uppercase text-[10px] gap-2"
                            >
                                <Plus size={14}/> Nouvel achat
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pt-2">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-muted-foreground"/>
                            </div>
                        ) : purchaseOrders.length === 0 ? (
                            <div className="text-center py-12 opacity-40">
                                <ShoppingCart className="mx-auto mb-2" size={32}/>
                                <p className="text-[10px] font-black uppercase tracking-widest">Aucun achat enregistré</p>
                            </div>
                        ) : (
                            purchaseOrders.map((po) => (
                                <div key={po.id} className="rounded-2xl bg-slate-50 p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <Package2 size={14} className="text-primary"/>
                                            <span className="font-bold text-sm">Achat #{po.id}</span>
                                            <Badge variant="outline" className="text-[9px] font-black uppercase">{po.status}</Badge>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg">{formatCurrency(po.total)}</p>
                                            <p className="text-[9px] text-muted-foreground">
                                                {po.createdAt ? new Date(po.createdAt).toLocaleString('fr-FR') : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {po.items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                                                <span>{item.qty} × {item.ingredientName ?? item.productName}</span>
                                                <span className="font-bold">{formatCurrency(item.qty * item.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AddPurchaseOrderModal
                supplier={supplier}
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onCreated={fetchPurchaseOrders}
            />
        </>
    );
}
