"use client";

import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Loader2, Plus, Trash2} from "lucide-react";
import {toast} from "sonner";
import * as suppliersApi from "@/src/lib/api/suppliers";
import * as catalogApi from "@/src/lib/api/catalog";
import {SupplierDto} from "@/src/lib/api/types/suppliers";
import {useStockStore} from "@/src/store/use-stock-store";
import {Product} from "@/src/types/menus";
import {formatCurrency} from "@/src/lib/formatCurrency";
import {getErrorMessage} from "@/src/lib/errors";

interface Line {
    subjectType: "ingredient" | "product";
    refId: string;
    qty: string;
    price: string;
}

const emptyLine: Line = {subjectType: "ingredient", refId: "", qty: "", price: ""};

export function AddPurchaseOrderModal({supplier, open, onOpenChange, onCreated}: {
    supplier: SupplierDto;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}) {
    const {ingredients, fetchIngredients} = useStockStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [lines, setLines] = useState<Line[]>([{...emptyLine}]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        fetchIngredients();
        catalogApi.listProductsAdmin().then(setProducts).catch(() => toast.error("Impossible de charger les produits"));
        setLines([{...emptyLine}]);
    }, [open, fetchIngredients]);

    const updateLine = (index: number, patch: Partial<Line>) => {
        setLines((prev) => prev.map((l, i) => (i === index ? {...l, ...patch} : l)));
    };

    const addLine = () => setLines((prev) => [...prev, {...emptyLine}]);
    const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

    const total = lines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);

    const isValid = lines.length > 0 && lines.every((l) => l.refId && Number(l.qty) > 0 && Number(l.price) >= 0);

    const handleSubmit = async () => {
        if (!isValid) {
            toast.error("Complétez chaque ligne (article, quantité, prix)");
            return;
        }
        setLoading(true);
        try {
            await suppliersApi.createPurchaseOrder({
                supplierId: supplier.id,
                items: lines.map((l) => ({
                    ingredientId: l.subjectType === "ingredient" ? Number(l.refId) : undefined,
                    productId: l.subjectType === "product" ? Number(l.refId) : undefined,
                    qty: Number(l.qty),
                    price: Number(l.price),
                })),
            });
            toast.success("Achat enregistré, stock mis à jour");
            onOpenChange(false);
            onCreated();
        } catch (error) {
            toast.error(getErrorMessage(error, "Échec de l'enregistrement de l'achat"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                        Nouvel achat — <span className="text-primary">{supplier.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[55vh] overflow-y-auto py-2">
                    {lines.map((line, index) => {
                        const items = line.subjectType === "ingredient" ? ingredients : products;
                        return (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end bg-slate-50 rounded-2xl p-3">
                                <div className="col-span-3 space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Type</Label>
                                    <Select
                                        value={line.subjectType}
                                        onValueChange={(v) => updateLine(index, {subjectType: v as Line["subjectType"], refId: ""})}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl bg-white border-none font-bold text-xs">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ingredient">Ingrédient</SelectItem>
                                            <SelectItem value="product">Produit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-4 space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Article</Label>
                                    <Select value={line.refId} onValueChange={(v) => updateLine(index, {refId: v})}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white border-none font-bold text-xs">
                                            <SelectValue placeholder="Choisir"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {items.map((item: { id: number; name: string }) => (
                                                <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-2 space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Qté</Label>
                                    <Input type="number" step="0.01" value={line.qty} onChange={(e) => updateLine(index, {qty: e.target.value})}
                                           className="h-11 rounded-xl bg-white border-none font-bold text-xs"/>
                                </div>

                                <div className="col-span-2 space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">PU (FCFA)</Label>
                                    <Input type="number" step="0.01" value={line.price} onChange={(e) => updateLine(index, {price: e.target.value})}
                                           className="h-11 rounded-xl bg-white border-none font-bold text-xs"/>
                                </div>

                                <div className="col-span-1 flex justify-center">
                                    <Button type="button" size="icon" variant="ghost" disabled={lines.length === 1}
                                            onClick={() => removeLine(index)}
                                            className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-30">
                                        <Trash2 size={14}/>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    <Button type="button" variant="outline" onClick={addLine}
                            className="w-full h-11 rounded-2xl border-dashed border-2 font-bold text-xs gap-2">
                        <Plus size={14}/> Ajouter une ligne
                    </Button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-dashed">
                    <span className="text-sm font-black uppercase text-muted-foreground">Total achat</span>
                    <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                </div>

                <DialogFooter className="pt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !isValid}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : "Enregistrer l'achat"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
