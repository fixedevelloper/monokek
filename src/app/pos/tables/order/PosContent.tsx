'use client'
import React, {useState, useMemo, useEffect} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {useQuery} from '@tanstack/react-query';
import {
    ShoppingCart, Trash2, Utensils, Minus, Plus,
    ChevronRight, ChevronLeft, Search, Store, UtensilsCrossed
} from 'lucide-react';

// Composants UI (hypothétiques selon ton setup)
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Card} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Sheet, SheetContent} from "@/components/ui/sheet";
import {cn} from "@/lib/utils";
import api from '@/src/lib/axios';
import {useCartStore} from '@/src/store/use-cart-store';
import {ModifierModal} from './ModifierModal';
import {toast} from 'sonner';
import {Category} from "../../../../types/menus";

const ALL_CATEGORIES = "TOUT";

const formatCurrency = (price: number | string | null | undefined) => {
    const value = typeof price === "string" ? parseFloat(price) : price;

    if (!value || isNaN(value)) return "0 FCFA";

    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
    }).format(value);
};


export default function PosContent() {
    const searchParams = useSearchParams();
    const tableId = searchParams.get('table');
    const router = useRouter();

    const {
        initCartForTable, items, total, orderId,
        clearCart, addItem, removeItem, updateQty
    } = useCartStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Toutes");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<any>(null);
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);

    // 1. Charger la commande active de la table (si elle existe)
    const {data: activeOrder, isLoading: isLoadingOrder} = useQuery({
        queryKey: ['active-order', tableId],
        queryFn: async () => {
            const res = await api.get(`/api/pos/tables/${tableId}/active-order`);
            return res.data;
        },
        enabled: !!tableId,
    });

    // 2. Charger les produits
    const {data: products = [], isLoading: isLoadingProducts} = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get("/api/pos/products");
            return res.data.data;
        },
    });

    // 3. Initialisation du panier avec la commande existante
    useEffect(() => {
        if (!isLoadingOrder && tableId) {
            // On passe activeOrder.data si ton Resource Laravel l'enveloppe dans data
            initCartForTable(Number(tableId), activeOrder?.data || activeOrder);
        }
    }, [activeOrder, tableId, isLoadingOrder, initCartForTable]);

    // --- ACTIONS ---

    const handleProductClick = (product: any) => {
        if (product.modifiers && product.modifiers.length > 0) {
            setSelectedProductForModifiers(product);
            setIsModifierModalOpen(true);
        } else {
            addItem({
                product_id: product.id,
                name: product.name,
                price: product.price,
                qty: 1,
                modifiers: [],
                instructions: ""
            });
        }
    };

    const handleConfirmModifiers = (selectedModifiers: any[]) => {
        if (!selectedProductForModifiers) return;
        const extraPrice = selectedModifiers.reduce((acc, curr) => acc + parseFloat(curr.price), 0);

        addItem({
            product_id: selectedProductForModifiers.id,
            name: selectedProductForModifiers.name,
            price: parseFloat(selectedProductForModifiers.price) + extraPrice,
            qty: 1,
            modifiers: selectedModifiers,
            instructions: ""
        });
        setIsModifierModalOpen(false);
    };

    const sanitizedItems = items.map(item => ({
        product_id: item.product_id,
        qty: item.qty, // Quantité de produits (ex: 2 Burgers)
        price: item.price,
        modifiers: item.modifiers?.map(m => ({
            modifier_item_id: m.id,
            price: m.price,
            quantity: m.quantity // <--- Sera 1 pour la base, et X pour les extras
        })) || []
    }));

    const handleRequestBilling = async () => {
        if (!items || items.length === 0) return toast.error("Le panier est vide");
        const loadingToast = toast.loading(orderId ? "Mise à jour de la commande..." : "Création de la commande...");

        try {
            const payload = {
                table_id: tableId,
                order_id: orderId, // Crucial pour le updateOrCreate côté Laravel
                subtotal: total,
                total: total,
                items: sanitizedItems,
            };

            await api.post('/api/pos/orders/request-bill', payload);
            toast.success("Commande envoyée !", {id: loadingToast});
            clearCart();
            router.push('/pos/tables');
        } catch (error) {
            toast.error("Erreur lors de l'envoi", {id: loadingToast});
        }
    };

    // --- FILTRAGE ---

    const categories = useMemo(() => {
        return ["Toutes", ...Array.from(new Set(products.map((p: any) => p.category.name)))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((p: any) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === "Toutes" || p.category.name === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, activeCategory]);

    // --- RENDER HELPERS ---

    const CartItemsList = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="p-6 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary"><ShoppingCart size={20}/></div>
                    <h2 className="font-black uppercase italic tracking-tighter text-xl">Détails Panier</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={clearCart}
                        className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></Button>
            </div>

            <ScrollArea className="flex-1 min-h-0 px-4 [&>[data-radix-scroll-area-viewport]]:scroll-smooth">
                {!items || items.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                        <Utensils size={48} className="mb-4"/>
                        <p className="font-bold uppercase text-[10px] tracking-widest">Le panier est vide</p>
                    </div>
                ) : (
                    <div className="space-y-4 py-6">
                        {items.map((item) => (
                            <div key={item.id}
                                 className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[2rem] border group transition-all">
                                <div className="flex justify-between mb-2">
                                    <span
                                        className="font-black text-sm uppercase italic leading-tight max-w-[70%]">{item.name}</span>
                                    <span
                                        className="font-black text-sm text-primary">{formatCurrency(item.price * item.qty)}</span>
                                </div>

                                {item.modifiers?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {item.modifiers.map((m: any) => (
                                            <span
                                                key={m.id}
                                                className="flex items-center gap-1 text-[9px] font-black bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-tighter"
                                            >
        <span className="text-slate-500">+</span>
                                                {m.name}

                                                {/* On n'affiche la quantité que si elle est > 1 pour ne pas encombrer le badge gratuit/base */}
                                                {m.quantity > 1 && (
                                                    <span
                                                        className="ml-1 bg-primary text-white px-1 rounded-sm text-[8px]">
            x{m.quantity}
          </span>
                                                )}
      </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <div
                                        className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-full p-1 border shadow-sm">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full"
                                                onClick={() => updateQty(item.id, item.qty - 1)}><Minus
                                            size={14}/></Button>
                                        <span className="w-8 text-center text-xs font-black">{item.qty}</span>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full"
                                                onClick={() => updateQty(item.id, item.qty + 1)}><Plus
                                            size={14}/></Button>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}
                                            className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-6">
                {/* Section Calculs */}
                <div className="space-y-3 px-2">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Sous-total</span>
                        <span className="text-sm font-bold tracking-tight">{formatCurrency(total)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span
                                className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">Montant Total</span>
                            <span className="text-[9px] text-slate-400 font-medium italic">Taxes incluses</span>
                        </div>
                        <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                {formatCurrency(total).split(',')[0]}
              </span>
                            {/* <span className="text-lg font-black italic text-primary">
                ,{formatCurrency(total).split(',')[1]}
              </span> */}
                        </div>
                    </div>
                </div>

                {/* Section Bouton - Effet Premium Dark */}
                <Button
                    onClick={handleRequestBilling}
                    disabled={items.length === 0}
                    className={cn(
                        "w-full h-16 rounded-[1.8rem] font-black uppercase tracking-[0.1em] transition-all relative overflow-hidden group",
                        "bg-slate-900 dark:bg-primary text-white hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-200 dark:shadow-none",
                        "disabled:opacity-20 disabled:grayscale"
                    )}
                >
                    <div className="flex items-center justify-center gap-3">
                        <span>Envoyer</span>
                        <div
                            className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <ChevronRight size={18}/>
                        </div>
                    </div>
                </Button>

                {/* Petit rappel visuel de sécurité */}
                <p className="text-center text-[8px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
                    Vérifiez la commande avant de valider
                </p>
            </div>
        </div>
    );

    // --- MAIN RENDER ---

    if (!tableId) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
            <Store size={64} className="mb-4 text-slate-200"/>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Table non identifiée</h2>
            <Button onClick={() => router.push('/pos/tables')}>Choisir une table</Button>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex-col md:flex-row">

            {/* SECTION MENU */}
            <div className="flex-1 md:flex-[2.5] flex flex-col border-r overflow-hidden bg-white dark:bg-slate-950">
                <header className="p-4 md:p-6 border-b flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.push('/pos/tables')}
                                className="rounded-2xl h-12 w-12 bg-slate-50"><ChevronLeft size={24}/></Button>
                        <div>
                            <span
                                className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Table</span>
                            <h1 className="text-3xl font-black uppercase italic tracking-tighter">{tableId}</h1>
                        </div>
                    </div>

                    <div className="relative flex-1 max-w-sm hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/>
                        <Input
                            placeholder="Rechercher..."
                            className="pl-12 h-14 bg-slate-100 rounded-[1.2rem] border-none font-bold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button variant="ghost" onClick={() => setIsCartOpen(true)}
                            className="md:hidden relative h-14 w-14 rounded-2xl bg-slate-100">
                        <ShoppingCart size={24}/>
                        {items?.length > 0 && (
                            <span
                                className="absolute -top-1 -right-1 bg-primary text-white text-[11px] w-6 h-6 rounded-full flex items-center justify-center font-black">
                {items.length}
              </span>
                        )}
                    </Button>
                </header>

                {/* BARRE CATEGORIES */}
                <div
                    className="px-6 py-5 bg-white dark:bg-slate-900 border-b flex gap-3 overflow-x-auto no-scrollbar scroll-smooth min-h-[80px] items-center">
                    {isLoadingProducts ? (
                        // Affichage d'états de chargement pour les catégories
                        Array.from({length: 5}).map((_, i) => (
                            <div key={i}
                                 className="h-10 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl shrink-0"/>
                        ))
                    ) : (
                        <>
                            {categories.map((cat:any) => {
                                const isActive = activeCategory === cat;
                                return (
                                    <Button
                                        key={cat as string}
                                        type="button" // Important pour éviter les soumissions de formulaires accidentelles
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            "rounded-2xl px-8 h-12 font-black uppercase text-[10px] tracking-[0.15em] transition-all shrink-0 border-2",
                                            isActive
                                                ? "bg-primary text-white border-primary shadow-xl shadow-primary/30 -translate-y-1"
                                                : "bg-slate-50 text-slate-400 border-slate-50 hover:bg-slate-100 hover:border-slate-200 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-500"
                                        )}
                                    >
                                        {cat}
                                    </Button>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* GRILLE PRODUITS */}
                <ScrollArea className="flex-1 p-6 h-180">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-24">
                        {isLoadingProducts ? (
                            Array.from({length: 10}).map((_, i) => <div key={i}
                                                                        className="h-48 bg-slate-100 animate-pulse rounded-[2rem]"/>)
                        ) : (
                            filteredProducts.map((product: any) => (
                                <Card
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    className="rounded-[2rem] p-4 border-2 border-transparent hover:border-primary/50 transition-all cursor-pointer group shadow-sm"
                                >
                                    <div
                                        className="aspect-square bg-slate-50 rounded-[1.5rem] mb-4 flex items-center justify-center relative overflow-hidden">
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
                                        <Badge
                                            className="absolute top-2 left-2 bg-gray-500/80 text-[8px]">{product.category.name}</Badge>
                                    </div>
                                    <h3 className="font-black text-xs uppercase italic truncate">{product.name}</h3>
                                    <p className="text-primary font-black text-lg italic">{formatCurrency(product.price)}</p>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* PANIER DESKTOP */}
            <aside
                className="hidden lg:flex w-[400px] shrink-0 flex-col bg-white dark:bg-slate-900 shadow-2xl border-l z-10">
                <CartItemsList/>
            </aside>

            {/* PANIER MOBILE */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetContent side="right" className="p-0 w-full sm:w-[450px]">
                    <CartItemsList/>
                </SheetContent>
            </Sheet>

            {/* MODAL MODIFICATEURS */}
            <ModifierModal
                product={selectedProductForModifiers}
                isOpen={isModifierModalOpen}
                onClose={() => setIsModifierModalOpen(false)}
                onConfirm={handleConfirmModifiers}
            />
        </div>
    );
}