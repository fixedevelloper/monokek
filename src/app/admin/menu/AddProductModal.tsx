"use client";

import {useRef, useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {DollarSign, ImageIcon, Package, Plus, Utensils, X} from "lucide-react";
import {toast} from "sonner";
import {Category} from "@/src/types/menus";
import api from "@/src/lib/axios";
import {useQueryClient} from "@tanstack/react-query";

interface AddProductModalProps {
    onProductAdded: () => void;
    categories: Category[]; // 👈 IMPORTANT
}


export function AddProductModal({ onProductAdded, categories }: AddProductModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categoryId, setCategoryId] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [productType, setProductType] = useState<'consumable' | 'storable'>('consumable');
    const queryClient = useQueryClient();
    // Gestion de la prévisualisation de l'image
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const formData = new FormData();

        // On ajoute manuellement les champs pour être sûr du format
        formData.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
        formData.append("price", (form.elements.namedItem("price") as HTMLInputElement).value);
        formData.append("category_id", categoryId);
        formData.append("sku", (form.elements.namedItem("sku") as HTMLInputElement).value);
        formData.append("stock_count", (form.elements.namedItem("stock") as HTMLInputElement).value);
        formData.append("alert_stock", (form.elements.namedItem("alert_stock") as HTMLInputElement).value);
        formData.append("incentive_amount", (form.elements.namedItem("incentive_amount") as HTMLInputElement).value);
        formData.append("type", productType);
        // Ajout du fichier image
        if (fileInputRef.current?.files?.[0]) {
            formData.append("image", fileInputRef.current.files[0]);
        }

        try {
            // Important : Pour l'upload d'image, on envoie le formData brut
            await api.post("/api/admin/products", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produit ajouté avec succès !");
            setOpen(false);
            setImagePreview(null);
            onProductAdded();
        } catch (error) {
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

            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2">
                        <Utensils className="text-primary" /> Nouveau Produit
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* SECTION IMAGE */}
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-[2rem] p-4 bg-muted/10 relative overflow-hidden group">
                        {imagePreview ? (
                            <div className="relative w-full h-32">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                                <button
                                    type="button"
                                    onClick={() => { setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Photo du produit</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* INFOS DE BASE */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1">Nom du plat / boisson</Label>
                        <Input name="name" placeholder="Ex: Soya de Boeuf" className="h-12 rounded-2xl bg-muted/30 border-none font-bold" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">Catégorie</Label>
                            <Select onValueChange={setCategoryId} required>
                                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-xs">
                                    <SelectValue placeholder="Catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat: any) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">Prix (FCFA)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="price" type="number" className="pl-10 h-12 rounded-2xl bg-muted/30 border-none font-bold" required />
                            </div>
                        </div>
                    </div>

                    {/* GESTION STOCK & SKU */}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">Commission Spéciale (FCFA)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="incentive_amount" type="number" className="pl-10 h-12 rounded-2xl bg-muted/30 border-none font-bold" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Type de gestion</Label>
                            <Select
                                name="type"
                                defaultValue={productType}
                                onValueChange={(value) => setProductType(value as "consumable" | "storable")}
                            >
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                                    <SelectValue placeholder="Choisir le type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="storable" className="flex flex-col items-start py-3">
                                        <span className="font-bold">📦 Storage</span>
                                        <p className="text-[10px] text-muted-foreground leading-tight">Produit fini (ex: Boisson)</p>
                                    </SelectItem>
                                    <SelectItem value="consumable" className="flex flex-col items-start py-3">
                                        <span className="font-bold">🍳 Consumable</span>
                                        <p className="text-[10px] text-muted-foreground leading-tight">Plat préparé / Ingrédient</p>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                        {/* Conditionnel : On n'affiche le stock que si c'est un produit stockable */}
                        {productType === "storable" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase ml-1">Stock actuel</Label>
                                    <Input name="stock" type="number" defaultValue='0' className="h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase ml-1">Seuil Alerte</Label>
                                    <Input name="alert_stock" type="number" defaultValue='0' className="h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                                </div>
                            </div>
                        )}

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">SKU / Code</Label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input name="sku" placeholder="CODE01" className="pl-10 h-12 rounded-2xl bg-muted/30 border-none font-bold" />
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