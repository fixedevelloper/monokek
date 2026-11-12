"use client";

import {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {History, Loader2, Package} from "lucide-react";
import {toast} from "sonner";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import * as catalogApi from "@/src/lib/api/catalog";
import {Product} from "@/src/types/menus";

const MOVEMENT_TYPES = [
    {value: "in", label: "Entrée"},
    {value: "out", label: "Sortie"},
    {value: "adjust", label: "Ajustement (comptage)"},
] as const;

function movementLabel(type: string) {
    return MOVEMENT_TYPES.find((m) => m.value === type)?.label ?? type;
}

/** Admin-only modal — the only remaining way to move a storable product's stock now that the
 * edit form's field is read-only. Every submission is traced server-side (author, motif, horodatage). */
export function AdjustProductStockModal({product, onUpdated, locationId}: {
    product: Product;
    onUpdated: () => void;
    /** Lieu de stock de la succursale de l'onglet (le stock d'un produit est tenu par lieu). */
    locationId?: number;
}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<"in" | "out" | "adjust">("in");
    const [qty, setQty] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const {data: movements = [], isLoading: isLoadingHistory} = useQuery({
        queryKey: ["product-stock-movements", product.id, locationId],
        queryFn: () => catalogApi.listProductStockMovements(product.id, locationId),
        enabled: open,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const qtyNumber = parseInt(qty, 10);
        if (isNaN(qtyNumber) || qtyNumber < 0) {
            toast.error("Quantité invalide");
            return;
        }
        setLoading(true);
        try {
            await catalogApi.adjustProductStock(product.id, {type, qty: qtyNumber, reason: reason || undefined}, locationId);
            toast.success("Stock mis à jour");
            queryClient.invalidateQueries({queryKey: ["products"]});
            queryClient.invalidateQueries({queryKey: ["product-stock-movements", product.id]});
            queryClient.invalidateQueries({queryKey: ["stock-items"]});
            setQty("");
            setReason("");
            onUpdated();
        } catch (error) {
            toast.error("Échec de l'ajustement du stock");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost"
                        className="h-9 w-9 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                        title="Ajuster le stock">
                    <Package size={16}/>
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2">
                        <Package className="text-emerald-600"/> Stock — {product.name}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="adjust" className="px-6 pb-6">
                    <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="adjust">Ajuster</TabsTrigger>
                        <TabsTrigger value="history" className="gap-1"><History size={14}/> Historique</TabsTrigger>
                    </TabsList>

                    <TabsContent value="adjust">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="rounded-2xl bg-slate-50 p-4 text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Stock
                                    actuel</p>
                                <p className="text-3xl font-black tracking-tighter">{product.stock_count}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1">Type de mouvement</Label>
                                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MOVEMENT_TYPES.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1">
                                    {type === "adjust" ? "Nouvelle quantité totale (comptage)" : "Quantité"}
                                </Label>
                                <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)}
                                       className="h-12 rounded-2xl bg-slate-50 border-none font-bold" required/>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1">Motif</Label>
                                <Input value={reason} onChange={(e) => setReason(e.target.value)}
                                       placeholder="Ex: Livraison fournisseur, casse, comptage mensuel..."
                                       className="h-12 rounded-2xl bg-slate-50 border-none font-bold"/>
                            </div>

                            <Button type="submit" disabled={loading}
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                                {loading ? <Loader2 className="animate-spin" size={18}/> : "Valider le mouvement"}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="space-y-2 max-h-[360px] overflow-y-auto">
                            {isLoadingHistory ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-muted-foreground"/>
                                </div>
                            ) : movements.length === 0 ? (
                                <p className="text-center text-[10px] font-black uppercase text-muted-foreground py-8">
                                    Aucun mouvement enregistré
                                </p>
                            ) : (
                                movements.map((m) => (
                                    <div key={m.id} className="flex items-start justify-between rounded-2xl bg-slate-50 p-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline"
                                                       className="text-[9px] font-black uppercase">{movementLabel(m.type)}</Badge>
                                                <span
                                                    className={`font-black ${m.qty >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                    {m.qty >= 0 ? "+" : ""}{m.qty}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">{m.reason}</p>
                                            <p className="text-[9px] text-muted-foreground">
                                                {m.authorName} · {m.createdAt ? new Date(m.createdAt).toLocaleString('fr-FR') : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
