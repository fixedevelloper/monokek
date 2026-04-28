"use client";

import { useState, useEffect } from "react";
import {
    Plus, Search, Edit3, Trash2, Filter,
    ChevronRight, UtensilsCrossed, Package,
    ArrowLeft,
    ChefHat,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency } from "@/src/lib/formatCurrency";
import { AddProductModal } from "./AddProductModal";
import api from "@/src/lib/axios";
import { Product, Category } from "@/src/types/menus";
import { EditProductModal } from "./EditProductModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import Link from "next/link";
import { RecipeSheet } from "./RecipeSheet";

export default function AdminMenuPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState("Tout");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isRecipeOpen, setIsRecipeOpen] = useState(false);

    const openRecipe = (product: Product) => {
        setSelectedProduct(product);
        setIsRecipeOpen(true);
    };

    // 1. Chargement des données depuis Laravel
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setLoading(true);

                const [productsRes, categoriesRes] = await Promise.all([
                    api.get<{ data: Product[] }>('/api/admin/products'),
                    api.get<{ data: Category[] }>('/api/admin/categories'),
                ]);

                setProducts(productsRes.data.data);
                setCategories(categoriesRes.data.data);


            } catch (error) {
                console.error(error);
                toast.error("Impossible de charger le menu");
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, []);
    console.log(products)

    // 2. Filtrage dynamique
    const filteredProducts = products.filter((p) => {
        const matchesCategory =
            activeCategoryId === null || p.category.id === activeCategoryId; // On utilise l'ID

        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });
    const refreshMenu = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/products'); // Ton appel API
            setProducts(res.data);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;

        try {
            setLoadingDelete(true);

            await api.delete(`/api/admin/products/${selectedId}`);

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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-white shadow-sm hover:bg-slate-100 shrink-0"
                            asChild
                        >
                            <Link href="/admin">
                                <ArrowLeft size={20} />
                            </Link>
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

                    {/* Groupe Actions (Recherche + Ajout) */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un plat..."
                                className="pl-11 h-12 w-full sm:w-64 rounded-2xl bg-white border-none shadow-sm focus-visible:ring-primary"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Le modal d'ajout */}
                        <div className="w-full sm:w-auto">
                            <AddProductModal onProductAdded={refreshMenu} categories={categories} />
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
                {loading ? (
                    <div className="grid grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-64 bg-slate-200 rounded-[2rem]" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <Card className="group overflow-hidden rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 transition-all hover:shadow-xl">
                                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
                                            <UtensilsCrossed className="text-slate-300 dark:text-slate-700" size={48} />
                                            <div className="absolute top-4 left-4">
                                                <Badge className="bg-white/90 text-black border-none text-[9px] font-black uppercase">{product.category.name}</Badge>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                                                <div className="flex gap-1">
                                                    <EditProductModal product={product} categories={categories} onProductUpdated={function (): void {

                                                    }} />
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedId(product.id);
                                                            setOpenDelete(true);
                                                        }}
                                                        size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-4">
                                                <Package size={14} className="text-muted-foreground" />
                                                <span className={`text-[10px] font-bold uppercase ${product.stock_count < 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                    Stock: {product.stock_count}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t border-dashed">
                                                <span className="text-2xl font-black text-primary tracking-tighter">
                                                    {formatCurrency(product.price)}
                                                </span>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => openRecipe(product)}
                                                    className="rounded-xl font-bold gap-2"
                                                >
                                                    <ChefHat size={18} /> Recette
                                                </Button>
                                                <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
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
        </div>
    );
}