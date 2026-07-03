'use client'
import React, {useEffect, useMemo, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Store,
    Trash2,
    Utensils,
    UtensilsCrossed
} from 'lucide-react';
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
    const queryClient = useQueryClient();
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
        // On ne filtre que les items qui n'ont pas encore été "envoyés" (si tu les gardes dans le store)
        // Ou plus simplement : si tu vides le store après envoi, tout le contenu actuel est le "Nouveau Round"
        if (!items || items.length === 0) return toast.error("Le panier est vide");

        const loadingToast = toast.loading("Envoi en cuisine...");

        try {
            const payload = {
                table_id: tableId,
                order_id: orderId, // Récupéré depuis useCartStore via activeOrder
                items: sanitizedItems,
                note: "" // Optionnel: ajouter un champ note pour le chef
            };

            // Utilisation du nouvel endpoint créé côté Laravel
            await api.post('/api/pos/orders/send-round', payload);

            await Promise.all([
                queryClient.invalidateQueries({queryKey: ['floors']}),
                queryClient.invalidateQueries({queryKey: ['active-order', tableId]})
            ]);

            toast.success("Round envoyé !", {id: loadingToast});

            clearCart(); // On vide le panier local car les items sont maintenant dans l'historique des rounds
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

    const CartItemsList = () => {
        const activeRounds = activeOrder?.data?.rounds || activeOrder?.rounds || [];

        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                {/* HEADER : Identité de la table */}
                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
                            <Utensils size={20}/>
                        </div>
                        <div>
                            <h2 className="font-black uppercase italic tracking-tighter text-xl leading-none">Table {tableId}</h2>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Suivi de commande</span>
                        </div>
                    </div>
                    {orderId && (
                        <Badge
                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black rounded-lg">
                            #{activeOrder?.data?.reference?.split('-')[1]}
                        </Badge>
                    )}
                </div>

                <ScrollArea className="flex-1 min-h-0 px-4 [&>[data-radix-scroll-area-viewport]]:scroll-smooth">
                    <div className="py-6 space-y-10">

                        {/* --- SECTION 1 : ROUNDS DÉJÀ ENVOYÉS --- */}
                        {activeRounds.map((round: any, index: number) => (
                            <div key={round.id} className="relative group">
                                {/* Ligne de séparation stylisée avec numéro de round */}
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                <span
                                    className="bg-white dark:bg-slate-900 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest border rounded-full">
                                    Round {round.round_number}
                                </span>
                                </div>

                                <div
                                    className="bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                    {/* Header du Round */}
                                    <div
                                        className="bg-slate-50/80 dark:bg-slate-800/80 px-5 py-3 border-b flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
    Envoyé à {new Date(round.sent_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })}
</span>
                                        <Badge variant="outline"
                                               className="text-[9px] font-black uppercase border-slate-200">
                                            {round.status === 'sent' ? '⏳ En cuisine' : '✅ Servi'}
                                        </Badge>
                                    </div>

                                    {/* Items du Round */}
                                    <div className="p-4 space-y-3">
                                        {round.items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-start gap-4">
                                                <div className="flex gap-3">
                                                    <span
                                                        className="font-black text-primary text-sm italic">{item.qty}x</span>
                                                    <div className="flex flex-col">
                                                    <span
                                                        className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 leading-tight">
                                                        {item.product?.name}
                                                    </span>
                                                        {/* Modificateurs s'il y en a */}
                                                        {item.modifiers?.map((m: any) => (
                                                            <span key={m.id}
                                                                  className="text-[9px] text-slate-400 font-medium tracking-tight italic">
                                                            + {m.modifier_item?.name}
                                                        </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-slate-400">
                                                {formatCurrency(item.total)}
                                            </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* --- SECTION 2 : PANIER ACTUEL (ROUND EN PRÉPARATION) --- */}
                        {items.length > 0 && (
                            <div className="relative">
                                <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                                <span
                                    className="bg-primary text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                                    Nouveau Round
                                </span>
                                </div>

                                <div
                                    className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-[2.5rem] border-2 border-primary border-dashed pt-8 space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id}
                                             className="bg-white dark:bg-slate-900 p-4 rounded-[1.8rem] border shadow-sm group transition-all hover:scale-[1.02]">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex flex-col gap-1">
                                                    <span
                                                        className="font-black text-sm uppercase italic leading-none">{item.name}</span>
                                                    <span
                                                        className="text-[10px] font-bold text-primary">{formatCurrency(item.price)} / unité</span>
                                                </div>
                                                <span
                                                    className="font-black text-sm">{formatCurrency(item.price * item.qty)}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div
                                                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border">
                                                    <Button size="icon" variant="ghost"
                                                            className="h-7 w-7 rounded-full hover:bg-white"
                                                            onClick={() => updateQty(item.id, item.qty - 1)}><Minus
                                                        size={12}/></Button>
                                                    <span
                                                        className="w-6 text-center text-xs font-black">{item.qty}</span>
                                                    <Button size="icon" variant="ghost"
                                                            className="h-7 w-7 rounded-full hover:bg-white"
                                                            onClick={() => updateQty(item.id, item.qty + 1)}><Plus
                                                        size={12}/></Button>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16}/>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* État vide */}
                        {(!items || items.length === 0) && activeRounds.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                                <Utensils size={48} className="mb-4 text-slate-400"/>
                                <p className="font-bold uppercase text-[10px] tracking-[0.2em]">En attente de
                                    commande</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* --- FOOTER : CALCULS --- */}
                <div
                    className={cn(
                        "p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]",
                        "relative z-20 shrink-0 mb-safe md:mb-0" // Ajout de shrink-0 et gestion des marges
                    )}>
                    <div className="space-y-4 px-2">
                        {/* Détail Cumul */}
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <span>Cumul Rounds</span>
                            <span>{formatCurrency(activeOrder?.data?.amounts.subtotal || 0)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none block mb-1">Total Général</span>
                                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                        {formatCurrency(total + (activeOrder?.data?.amounts.total || 0)).split(',')[0]}
                    </span>
                                </div>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black py-2 px-4 rounded-full">
                                {activeRounds.length + (items.length > 0 ? 1 : 0)} ROUNDS AU TOTAL
                            </Badge>
                        </div>
                    </div>

                    <Button
                        onClick={handleRequestBilling}
                        disabled={items.length === 0}
                        className={cn(
                            "w-full h-16 mb-5 rounded-[2rem] font-black uppercase tracking-[0.15em] transition-all relative overflow-hidden group",
                            "bg-slate-900 dark:bg-primary text-white hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-none"
                        )}
                    >
                        <div className=" flex items-center justify-center gap-3">
                            <span>Lancer le Round {activeRounds.length + 1}</span>
                            <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <ChevronRight size={18}/>
                            </div>
                        </div>
                    </Button>
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---

    if (!tableId) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
            <Store size={64} className="mb-4 text-slate-200"/>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Table non identifiée</h2>
            <Button onClick={() => router.push('/pos/sales/tables')}>Choisir une table</Button>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex-col md:flex-row">

            {/* SECTION MENU */}
            <div className="flex-1 md:flex-[2.5] flex flex-col border-r overflow-hidden bg-white dark:bg-slate-950">
                <header className="p-4 md:p-6 border-b flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.push('/pos/sales/tables')}
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
                            {categories.map((cat: any) => {
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