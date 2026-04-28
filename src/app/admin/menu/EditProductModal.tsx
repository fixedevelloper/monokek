"use client";



import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; // Ajout pour le statut
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Edit3, Package, DollarSign, Info } from "lucide-react";
import { toast } from "sonner";

interface EditProductModalProps {
    product: any;
    categories: any[];
    onProductUpdated: () => void;
}

export function EditProductModal({ product, categories, onProductUpdated }: EditProductModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // On gère l'état du switch séparément car FormData ne récupère pas bien les Switch/Checkboxes non-natifs
    const [isActive, setIsActive] = useState(product.is_active);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            price: formData.get("price"),
            category_id: formData.get("category_id"),
            sku: formData.get("sku"),
             stock: formData.get("stock"),
            track_stock: formData.get("track_stock") === "on", // Si tu gères le stock
            is_active: isActive,
        };

        try {
            // Simulation appel API Laravel (PATCH)
            // await api.patch(`/products/${product.id}`, data);

            toast.success(`${data.name} mis à jour avec succès !`);
            setOpen(false);
            onProductUpdated();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <Edit3 size={14} />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none shadow-2xl">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2">
                            <Edit3 className="text-blue-600" /> Édition
                        </DialogTitle>
                        {/* Badge de statut rapide dans le header */}
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                            <span className="text-[9px] font-black uppercase tracking-tighter">En vente</span>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Section Informations de base */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-3xl">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Nom du produit</Label>
                            <Input name="name" defaultValue={product.name} className="h-12 rounded-2xl bg-white border-none shadow-sm focus-visible:ring-blue-500" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Prix (FCFA)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                                    <Input name="price" type="number" defaultValue={product.price} className="pl-10 h-12 rounded-2xl bg-white border-none shadow-sm" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1">Stock Initial</Label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input name="stock" type="number" defaultValue={product.stock_count} className="pl-10 h-12 rounded-2xl bg-muted/30 border-none" required />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Section Catégorie */}
                        <div className="space-y-2 px-1">
                            <Label className="text-[10px] font-black uppercase ml-1">Catégorie de vente</Label>
                            <Select name="category_id"
                                defaultValue={product.category.id?.toString()}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-100 border-none">
                                    <SelectValue placeholder="Changer la catégorie" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">

                                    {categories.filter(c => c.id !== 0 && c.id !== null).map((cat) => (
                                        <SelectItem
                                            key={cat.id}
                                            value={cat.id.toString()}
                                            className="rounded-xl my-1 cursor-pointer"
                                        >
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">SKU / Code</Label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="sku" defaultValue={product.sku} className="pl-10 h-12 rounded-2xl bg-white border-none shadow-sm" />
                            </div>
                        </div></div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            {loading ? "Mise à jour en cours..." : "Sauvegarder les modifications"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}