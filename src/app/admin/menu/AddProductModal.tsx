"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, DollarSign, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Category } from "@/src/types/menus";
import api from "@/src/lib/axios";

interface AddProductModalProps {
    onProductAdded: () => void;
    categories: Category[]; // 👈 IMPORTANT
}

export function AddProductModal({ onProductAdded, categories }: AddProductModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categoryId, setCategoryId] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const data = {
            name: formData.get("name") as string,
            price: Number(formData.get("price")),
            category_id: Number(categoryId), // ✅ FIX
            stock_count: Number(formData.get("stock")),
             sku: formData.get("sku"),
             stock: formData.get("stock"),
        };

        try {
            await api.post("/api/admin/products", data);

            toast.success("Produit ajouté au menu !");
            setOpen(false);
            onProductAdded();

        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'ajout");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
                    <Plus size={20} /> Ajouter
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2">
                        <Utensils className="text-primary" /> Nouveau Produit
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1">Nom du plat / boisson</Label>
                        <Input name="name" placeholder="Ex: Soya de Boeuf" className="h-12 rounded-2xl bg-muted/30 border-none" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">Prix (FCFA)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="price" type="number" className="pl-10 h-12 rounded-2xl bg-muted/30 border-none" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">Stock Initial</Label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="stock" type="number" defaultValue="100" className="pl-10 h-12 rounded-2xl bg-muted/30 border-none" required />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1">Catégorie</Label>
                        <Select onValueChange={(value) => setCategoryId(value)} required>
                            <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none">
                                <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1">SKU / Code</Label>
                        <div className="relative">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input name="sku" type="string" defaultValue="" className="pl-10 h-12 rounded-2xl bg-muted/30 border-none" required />
                        </div>
                    </div>
                    </div>
                   


                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg">
                            {loading ? "Envoi..." : "Confirmer l'ajout"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}