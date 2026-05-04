"use client";

import React, {useState} from "react";
import {ArrowLeft, BookOpen, ChefHat, FileUp, Package, Search, Trash2, UtensilsCrossed,} from "lucide-react";
import {AnimatePresence, motion} from "framer-motion";
// UI Components
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {toast} from "sonner";
import {formatCurrency} from "@/src/lib/formatCurrency";
import {AddProductModal} from "./AddProductModal";
import api from "@/src/lib/axios";
import {Category, Product} from "@/src/types/menus";
import {EditProductModal} from "./EditProductModal";
import {ConfirmDeleteModal} from "./ConfirmDeleteModal";
import Link from "next/link";
import {RecipeSheet} from "./RecipeSheet";
import {SupplementSheet} from "./SupplementSheet";
import {useQuery, useQueryClient} from '@tanstack/react-query';

export default function AdminMenuPage() {
    const [activeCategory, setActiveCategory] = useState("Tout");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const queryClient = useQueryClient();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isRecipeOpen, setIsRecipeOpen] = useState(false);
    const [isSupplementOpen, setIsSupplementeOpen] = useState(false);

    const openRecipe = (product: Product) => {
        setSelectedProduct(product);
        setIsRecipeOpen(true);
    };
    const openSupplement = (product: Product) => {
        setSelectedProduct(product);
        setIsSupplementeOpen(true);
    };
    const {
        data: allModifiersGroups = [],
    } = useQuery({
        queryKey: ['modifier-groups'],
        queryFn: async () => {
            const res = await api.get("/api/admin/modifiers");
            return res.data.data || res.data;
        },
        // Optionnel : Garder les données fraîches pendant 5 minutes
        staleTime: 5 * 60 * 1000,
    });
    // 1. Chargement des données depuis Laravel
    // 1. Récupération des Produits
    const {
        data: productsData,
        isLoading: isProductsLoading,
        isError: isProductsError
    } = useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const res = await api.get<{ data: Product[] }>('/api/admin/products');
            return res.data.data;
        },
    });

// 2. Récupération des Catégories
    const {
        data: categoriesData,
        isLoading: isCategoriesLoading
    } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await api.get<{ data: Category[] }>('/api/admin/categories');
            return res.data.data;
        },
    });

// 3. Sécurisation des données pour le filtrage
// On s'assure que products est TOUJOURS un tableau, même pendant le chargement
    const products = productsData || [];
    const categories = categoriesData || [];
    const isLoading = isProductsLoading || isCategoriesLoading;



    // 2. Filtrage dynamique
    const filteredProducts = products?.filter((p: Product) => {
        const matchesCategory =
            activeCategoryId === null || p.category.id === activeCategoryId; // On utilise l'ID

        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });
    const refreshMenu = () => {
        // Cela va forcer useQuery à refaire l'appel API immédiatement
        queryClient.invalidateQueries({ queryKey: ["products"] });

        // Si tu veux aussi rafraîchir les catégories
        queryClient.invalidateQueries({ queryKey: ["categories"] });
    };

    const handleDelete = async () => {
        if (!selectedId) return;

        try {
            setLoadingDelete(true);

            await api.delete(`/api/admin/products/${selectedId}`);
           // queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Produit supprimé !");
            setOpenDelete(false);
            refreshMenu(); // refresh list

        } catch (error) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setLoadingDelete(false);
        }
    };
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-20">

            {/* HEADER DYNAMIQUE */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-100 shrink-0" asChild>
                            <Link href="/admin"><ArrowLeft size={20}/></Link>
                        </Button>

                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                                Gestion du <span className="text-primary">Menu</span>
                            </h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                Total : {products.length} articles
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Barre de Recherche */}
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Rechercher un plat..."
                                className="pl-11 h-12 w-full sm:w-64 rounded-2xl bg-white border-none shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* ACTIONS : Import + Add */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Nouveau Bouton Import */}
                            <Button
                                variant="outline"
                                className="h-12 px-5 rounded-2xl border-none bg-white shadow-sm font-bold gap-2 hover:bg-slate-50 transition-all"
                                asChild
                            >
                                <Link href="/admin/menu/import">
                                    <FileUp size={18} className="text-primary" />
                                    <span className="hidden lg:inline">Importation Masse</span>
                                </Link>
                            </Button>

                            <AddProductModal onProductAdded={refreshMenu} categories={categories}/>
                        </div>
                    </div>
                </div>

                {/* FILTRE CATÉGORIES CORRIGÉ */}
                <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                        variant={activeCategoryId === null ? "default" : "secondary"}
                        onClick={() => setActiveCategoryId(null)}
                        className="rounded-full px-6 font-bold uppercase text-[10px]"
                    >
                        Tout
                    </Button>

                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={activeCategoryId === cat.id ? "default" : "secondary"}
                            onClick={() => setActiveCategoryId(cat.id)}
                            className="rounded-full px-6 font-bold uppercase text-[10px] transition-all"
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
            </header>

            {/* GRILLE DE PRODUITS */}
            <main className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="grid grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-64 bg-slate-200 rounded-[2rem]"/>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{opacity: 0, scale: 0.9}}
                                    animate={{opacity: 1, scale: 1}}
                                    exit={{opacity: 0, scale: 0.9}}
                                >
                                    <Card
                                        className="group overflow-hidden rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 transition-all hover:shadow-xl">
                                        <div
                                            className="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    // h-48 = 12rem (192px), w-48 = 12rem
                                                    // object-cover est indispensable pour ne pas écraser l'image
                                                    className="h-48 w-58 object-cover rounded-2xl"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <UtensilsCrossed className="text-slate-300 dark:text-slate-700"
                                                                 size={48}/>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <Badge
                                                    className="bg-white/90 text-black border-none text-[9px] font-black uppercase">{product.category.name}</Badge>
                                            </div>
                                            <div className="absolute top-4 right-4">
                                                                                         <span
                                                                                             className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                                                                 product.type === 'storable'
                                                                                                     ? 'bg-blue-100 text-blue-600'
                                                                                                     : 'bg-orange-100 text-orange-600'
                                                                                             }`}>
    {product.type === 'storable' ? '📦 Storage' : '🍳 Consom'}
</span>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                                                <div className="flex gap-1">
                                                    <EditProductModal product={product} categories={categories}
                                                                      onProductUpdated={function (): void {

                                                                      }}/>
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedId(product.id);
                                                            setOpenDelete(true);
                                                        }}
                                                        size="icon" variant="ghost"
                                                        className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600">
                                                        <Trash2 size={14}/>
                                                    </Button>
                                                </div>
                                            </div>

                                            {product.type === 'storable' && (
                                                <div className="space-y-1.5 mb-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={14} className={product.stock_count <= 0 ? "text-red-500" : "text-slate-400"} />
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Disponibilité
                </span>
                                                        </div>

                                                        {/* Badge d'état dynamique */}
                                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase italic ${
                                                            product.stock_count <= 0 ? 'bg-red-100 text-red-600' :
                                                                product.stock_count < 10 ? 'bg-amber-100 text-amber-600' :
                                                                    'bg-emerald-100 text-emerald-600'
                                                        }`}>
                {product.stock_count <= 0 ? 'Rupture' : product.stock_count < product.alert_stock ? 'Bas' : 'OK'}
            </span>
                                                    </div>

                                                    {/* Barre de progression visuelle */}
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${
                                                                product.stock_count <= 0 ? 'w-0' :
                                                                    product.stock_count < 10 ? 'bg-amber-500 w-1/4' :
                                                                        'bg-emerald-500 w-full'
                                                            }`}
                                                        />
                                                    </div>

                                                    <p className={`text-[10px] font-black ${product.stock_count < 5 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                                                        {product.stock_count} UNITÉS EN RÉSERVE
                                                    </p>
                                                </div>
                                            )}


                                            <div
                                                className="flex justify-between items-center pt-4 border-t border-dashed">
                                                <span className="text-2xl font-black text-primary tracking-tighter">
                                                    {formatCurrency(product.price)}
                                                </span>

                                            </div>
                                            <div className="flex items-center gap-2 pt-4 border-t border-dashed">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => openSupplement(product)}
                                                    className="flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 h-11 bg-slate-100 hover:bg-primary hover:text-white transition-all group"
                                                >
                                                    <ChefHat size={16} className="group-hover:rotate-12 transition-transform" />
                                                    Suppléments
                                                </Button>

                                                <Button
                                                    variant="secondary"
                                                    onClick={() => openRecipe(product)}
                                                    className="flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 h-11 bg-slate-50 border border-slate-100 hover:border-primary transition-all"
                                                >
                                                    <BookOpen size={16} />
                                                    Recette
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
            <ConfirmDeleteModal
                open={openDelete}
                onOpenChange={setOpenDelete}
                onConfirm={handleDelete}
                loading={loadingDelete}
                title="Supprimer ce produit ?"
                description="Cette action supprimera définitivement le produit du menu."
            />
            <RecipeSheet
                product={selectedProduct}
                open={isRecipeOpen}
                onOpenChange={setIsRecipeOpen}
            />
            <SupplementSheet
                product={selectedProduct}
                open={isSupplementOpen}
                onOpenChange={setIsSupplementeOpen}
                allModifiersGroups={allModifiersGroups || []}
                isLoadingGroups={isLoading}
            />
        </div>
    );
}