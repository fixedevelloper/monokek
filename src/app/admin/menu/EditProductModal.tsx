"use client";


import {useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch"; // Ajout pour le statut
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {DollarSign, Edit3, ImageIcon} from "lucide-react";
import {toast} from "sonner";
import * as catalogApi from "@/src/lib/api/catalog";
import {useQueryClient} from "@tanstack/react-query";
import {ImagePickerModal} from "@/components/shared/ImagePickerModal";
import {Category, Product} from "@/src/types/menus";

interface EditProductModalProps {
    product: Product;
    categories: Category[];
    onProductUpdated: () => void;
}



export function EditProductModal({ product, categories, onProductUpdated }: EditProductModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(product.is_active);
    const [imageUrl, setImageUrl] = useState(product.image_url || "");
    const [productType, setProductType] = useState(product?.type || "storable");
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const getVal = (name: string) => {
            const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
            return el ? el.value : "";
        };

        try {
            await catalogApi.updateProduct(product.id, {
                name: getVal("name"),
                price: parseFloat(getVal("price")) || 0,
                categoryId: Number(getVal("category_id")) || product.category.id,
                sku: getVal("sku"),
                type: productType,
                active: isActive,
                incentiveAmount: parseFloat(getVal("incentive_amount")) || 0,
                stockCount: productType === "storable" ? parseInt(getVal("stock"), 10) || 0 : undefined,
                alertStock: productType === "storable" ? parseInt(getVal("alert_stock"), 10) || 0 : undefined,
                image: imageUrl || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produit mis à jour !");
            setOpen(false);
            onProductUpdated();
        } catch (error) {
            toast.error("Erreur lors de la modification");
        } finally {
            setLoading(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                    <Edit3 size={16} />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-6 pb-2">
                        <div className="flex justify-between items-center">
                            <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2">
                                <Edit3 className="text-blue-600" /> Édition
                            </DialogTitle>
                            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
                                <span className="text-[10px] font-black uppercase tracking-tight">Actif</span>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Preview Image (bibliothèque MinIO + upload) */}
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-2 gap-3 bg-slate-50 transition-colors hover:border-blue-300">
                            {imageUrl ? (
                                <img src={imageUrl} className="w-full h-32 object-contain rounded-2xl" alt="Preview"
                                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                                <div className="h-32 flex flex-center items-center"><ImageIcon className="text-slate-300" /></div>
                            )}
                            <div className="w-full px-2 pb-2">
                                <ImagePickerModal
                                    folder="products"
                                    onSelect={setImageUrl}
                                    trigger={
                                        <Button type="button" variant="outline" className="w-full h-11 rounded-2xl bg-white font-bold text-xs">
                                            {imageUrl ? "Changer l'image" : "Choisir une image"}
                                        </Button>
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">Nom du produit</Label>
                            <Input name="name" defaultValue={product.name} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1">Prix (FCFA)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                                    <Input name="price" type="number" defaultValue={product.price} className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1">Catégorie</Label>
                                <Select name="category_id" defaultValue={String(product.category.id)}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Type de gestion</Label>
                                <Select
                                    name="type"
                                    defaultValue={productType}
                                    onValueChange={setProductType}
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

                            {/* Conditionnel : On n'affiche le stock que si c'est un produit stockable */}
                            {productType === "storable" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase ml-1">Stock actuel</Label>
                                        <Input name="stock" type="number" defaultValue={product.stock_count} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase ml-1">Seuil Alerte</Label>
                                        <Input name="alert_stock" type="number" defaultValue={product.alert_stock} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">Commission Spéciale (FCFA)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input defaultValue={product.incentive_amount} name="incentive_amount" type="number" className="pl-10 h-12 rounded-2xl bg-muted/30 border-none font-bold" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1">SKU / Code barres</Label>
                            <Input name="sku" defaultValue={product.sku ?? undefined} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg"
                        >
                            {loading ? "Mise à jour..." : "Enregistrer les modifications"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}