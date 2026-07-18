'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Store,
    Trash2,
    Utensils,
    UtensilsCrossed
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import api from '@/src/lib/axios';
import { useCartStore } from '@/src/store/use-cart-store';
import { ModifierModal } from './ModifierModal';
import { toast } from 'sonner';

const formatCurrency = (price: number | string | null | undefined) => {
    const value = typeof price === "string" ? parseFloat(price) : price;
    if (value === null || value === undefined || isNaN(value)) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[formatCurrency] valeur invalide reçue :', price);
        }
        return "0 FCFA";
    }
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
        initCartForTable, syncOrderId, items, total, orderId,
        clearCart, addItem, removeItem, updateQty
    } = useCartStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Toutes");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<any>(null);
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
    // Empêche le double-clic / double-tap d'envoyer deux fois le même round
    const [isSubmittingRound, setIsSubmittingRound] = useState(false);
    // Empêche double-clic sur les actions d'édition d'un round déjà envoyé (par item)
    const [pendingRoundItemIds, setPendingRoundItemIds] = useState<Set<number>>(new Set());
    const queryClient = useQueryClient();

    const refreshActiveOrder = async () => {
        await queryClient.invalidateQueries({ queryKey: ['active-order', tableId] });
        await queryClient.refetchQueries({ queryKey: ['active-order', tableId] });
    };

    // Un round n'est éditable que tant qu'il n'est pas encore servi.
    // Adapte 'sent' si ton statut "modifiable" a un autre nom côté backend.
    const isRoundEditable = (round: any) => round?.status === 'sent';

    const handleUpdateRoundItemQty = async (roundId: number, itemId: number, newQty: number) => {
        if (pendingRoundItemIds.has(itemId)) return; // anti double-clic

        setPendingRoundItemIds(prev => new Set(prev).add(itemId));
        try {
            await api.patch(`/api/pos/rounds/${roundId}/items/${itemId}`, { qty: newQty });
            await refreshActiveOrder();
            if (newQty === 0) {
                toast.success("Article retiré du round");
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || "Impossible de modifier cet article";
            toast.error(message);
        } finally {
            setPendingRoundItemIds(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const handleRemoveRoundItem = (roundId: number, itemId: number) => {
        handleUpdateRoundItemQty(roundId, itemId, 0);
    };

    // 1. Charger la commande active de la table
    const { data: activeOrder, isLoading: isLoadingOrder } = useQuery({
        queryKey: ['active-order', tableId],
        queryFn: async () => {
            const res = await api.get(`/api/pos/tables/${tableId}/active-order`);
            return res.data;
        },
        enabled: !!tableId,
    });

    // 2. Charger les produits
    const { data: products = [], isLoading: isLoadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get("/api/pos/products");
            return res.data.data;
        },
    });

    // Extraction normalisée des données de la commande (gère l'imbrication data de Laravel Resource)
    const orderData = useMemo(() => {
        if (!activeOrder) return null;
        if (activeOrder.data?.data) return activeOrder.data.data;
        if (activeOrder.data) return activeOrder.data;
        return activeOrder;
    }, [activeOrder]);

    // 3a. Reset du panier UNIQUEMENT si on change réellement de table.
    // Ne dépend que de tableId, jamais de orderData : un refetch en arrière-plan
    // (invalidation ['floors'], focus fenêtre, event temps réel) ne doit jamais
    // vider le round en cours de composition par le serveur.
    useEffect(() => {
        if (tableId) {
            initCartForTable(Number(tableId));
        }
    }, [tableId, initCartForTable]);

    // 3b. Synchro de l'orderId avec le serveur, sans jamais toucher aux items locaux.
    // Utile par ex. si l'order_id devient connu après le premier round envoyé
    // par un autre poste, ou après un refresh de page.
    useEffect(() => {
        if (!isLoadingOrder && tableId) {
            syncOrderId(orderData?.id ?? null);
        }
    }, [orderData?.id, tableId, isLoadingOrder, syncOrderId]);

    // --- ACTIONS ---

    const handleProductClick = (product: any) => {
        if (product.modifiers && product.modifiers.length > 0) {
            setSelectedProductForModifiers(product);
            setIsModifierModalOpen(true);
        } else {
            addItem({
                product_id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                qty: 1,
                modifiers: [],
                instructions: ""
            });
        }
    };

    const handleConfirmModifiers = (selectedModifiers: any[]) => {
        if (!selectedProductForModifiers) return;

        const extraPrice = selectedModifiers.reduce((acc, curr) => acc + parseFloat(curr.price), 0);
        const basePrice = parseFloat(selectedProductForModifiers.price);

        addItem({
            product_id: selectedProductForModifiers.id,
            name: selectedProductForModifiers.name,
            price: basePrice + extraPrice,
            qty: 1,
            modifiers: selectedModifiers,
            instructions: ""
        });
        setIsModifierModalOpen(false);
    };

    const sanitizedItems = useMemo(() => {
        return items.map(item => ({
            product_id: item.product_id,
            qty: item.qty,
            price: item.price,
            modifiers: item.modifiers?.map(m => ({
                modifier_item_id: m.id,
                price: parseFloat(m.price),
                quantity: m.quantity || 1
            })) || []
        }));
    }, [items]);

    const handleRequestBilling = async () => {
        if (!items || items.length === 0) return toast.error("Le panier est vide");
        if (isSubmittingRound) return; // garde anti double-clic / double-tap

        setIsSubmittingRound(true);
        const loadingToast = toast.loading("Envoi en cuisine...");

        try {
            const payload = {
                table_id: tableId,
                order_id: orderId,
                items: sanitizedItems,
                note: ""
            };

            await api.post('/api/pos/orders/send-round', payload);

            // On attend la re-synchronisation complète de l'état serveur avant de toucher au panier local
            await refreshActiveOrder();
            queryClient.invalidateQueries({ queryKey: ['floors'] }); // Peut tourner en arrière-plan

            toast.success("Round envoyé !", { id: loadingToast });

            // Le round vient d'être confirmé et rechargé dans orderData.rounds (section serveur) :
            // on vide le panier local pour éviter que ces items s'affichent en double
            // (une fois dans "Round N" et une fois dans "Nouveau Round") et pour empêcher
            // qu'un nouvel envoi ne les renvoie une seconde fois en cuisine.
            clearCart();
            setIsCartOpen(false);
        } catch (error: any) {
            const message = error?.response?.data?.message || "Erreur lors de l'envoi";
            toast.error(message, { id: loadingToast });
        } finally {
            setIsSubmittingRound(false);
        }
    };

    // --- FILTRAGE ---

    const categories = useMemo(() => {
        return ["Toutes", ...Array.from(new Set(products.map((p: any) => p.category?.name).filter(Boolean)))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((p: any) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === "Toutes" || p.category?.name === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, activeCategory]);

    // --- RENDER HELPERS ---

    const CartItemsList = () => {
        // Lecture robuste et centralisée des rounds depuis notre orderData normalisé
        const activeRounds = orderData?.rounds || [];

        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                {/* HEADER */}
                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
                            <Utensils size={20} />
                        </div>
                        <div>
                            <h2 className="font-black uppercase italic tracking-tighter text-xl leading-none">Table {tableId}</h2>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Suivi de commande</span>
                        </div>
                    </div>
                    {orderId && (
                        <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black rounded-lg">
                            #{ orderData?.reference?.split('-')[1] || '---' }
                        </Badge>
                    )}
                </div>

                <ScrollArea className="flex-1 min-h-0 px-4">
                    <div className="py-6 space-y-10">

                        {/* --- SECTION 1 : ROUNDS DU SERVEUR --- */}
                        {activeRounds.map((round: any) => (
                            <div key={round.id} className="relative group">
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <span className="bg-white dark:bg-slate-900 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest border rounded-full">
                                        Round {round.round_number}
                                    </span>
                                </div>

                                <div className="bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                    <div className="bg-slate-50/80 dark:bg-slate-800/80 px-5 py-3 border-b flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                            Envoyé à {new Date(round.sent_at).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        })}
                                        </span>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">
                                            {round.status === 'sent' ? '⏳ En cuisine' : '✅ Servi'}
                                        </Badge>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {round.items?.map((item: any) => {
                                            const editable = isRoundEditable(round);
                                            const isPending = pendingRoundItemIds.has(item.id);

                                            return (
                                                <div key={item.id} className="flex justify-between items-start gap-4">
                                                    <div className="flex gap-3 flex-1">
                                                        {editable ? (
                                                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full px-1 py-0.5 border shrink-0 h-fit">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    disabled={isPending}
                                                                    className="h-6 w-6 rounded-full hover:bg-white"
                                                                    onClick={() => handleUpdateRoundItemQty(round.id, item.id, item.qty - 1)}
                                                                >
                                                                    <Minus size={10} />
                                                                </Button>
                                                                <span className="w-5 text-center text-xs font-black">{item.qty}</span>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    disabled={isPending}
                                                                    className="h-6 w-6 rounded-full hover:bg-white"
                                                                    onClick={() => handleUpdateRoundItemQty(round.id, item.id, item.qty + 1)}
                                                                >
                                                                    <Plus size={10} />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="font-black text-primary text-sm italic">{item.qty}x</span>
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 leading-tight">
                                                                {item.product?.name}
                                                            </span>
                                                            {item.modifiers?.map((m: any) => (
                                                                <span key={m.id} className="text-[9px] text-slate-400 font-medium tracking-tight italic">
                                                                    + {m.modifier_item?.name || m.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs font-black text-slate-400">
                                                            {formatCurrency(item.total)}
                                                        </span>
                                                        {editable && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={isPending}
                                                                onClick={() => handleRemoveRoundItem(round.id, item.id)}
                                                                className="h-6 w-6 text-slate-300 hover:text-red-500"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* --- SECTION 2 : PANIER EN COURS --- */}
                        {items.length > 0 && (
                            <div className="relative">
                                <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                                    <span className="bg-primary text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                                        Nouveau Round
                                    </span>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-[2.5rem] border-2 border-primary border-dashed pt-8 space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-[1.8rem] border shadow-sm group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-sm uppercase italic leading-none">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-primary">{formatCurrency(item.price)} / unité</span>
                                                </div>
                                                <span className="font-black text-sm">{formatCurrency(item.price * item.qty)}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1 border">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-white" onClick={() => updateQty(item.id, item.qty - 1)}>
                                                        <Minus size={12} />
                                                    </Button>
                                                    <span className="w-6 text-center text-xs font-black">{item.qty}</span>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-white" onClick={() => updateQty(item.id, item.qty + 1)}>
                                                        <Plus size={12} />
                                                    </Button>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {items.length === 0 && activeRounds.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                                <Utensils size={48} className="mb-4 text-slate-400" />
                                <p className="font-bold uppercase text-[10px] tracking-[0.2em]">En attente de commande</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* FOOTER */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0">
                    <div className="space-y-4 px-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <span>Cumul Rounds</span>
                            <span>{formatCurrency(orderData?.amounts?.subtotal || 0)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none block mb-1">Total Général</span>
                                <span className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                                    {formatCurrency(total + (orderData?.amounts?.total || 0)).split(',')[0]}
                                </span>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black py-2 px-4 rounded-full">
                                {activeRounds.length + (items.length > 0 ? 1 : 0)} ROUNDS AU TOTAL
                            </Badge>
                        </div>
                    </div>

                    <Button
                        onClick={handleRequestBilling}
                        disabled={items.length === 0 || isSubmittingRound}
                        className="w-full h-16 mb-5 rounded-[2rem] font-black uppercase tracking-[0.15em] bg-slate-900 dark:bg-primary text-white hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-60 disabled:hover:scale-100"
                    >
                        <div className="flex items-center justify-center gap-3">
                            {isSubmittingRound ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Envoi en cours...</span>
                                </>
                            ) : (
                                <>
                                    <span>Lancer le Round {activeRounds.length + 1}</span>
                                    <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <ChevronRight size={18} />
                                    </div>
                                </>
                            )}
                        </div>
                    </Button>
                </div>
            </div>
        );
    };

    if (!tableId) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
            <Store size={64} className="mb-4 text-slate-200" />
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
                        <Button variant="ghost" onClick={() => router.push('/pos/sales/tables')} className="rounded-2xl h-12 w-12 bg-slate-50">
                            <ChevronLeft size={24} />
                        </Button>
                        <div>
                            <span className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Table</span>
                            <h1 className="text-3xl font-black uppercase italic tracking-tighter">{tableId}</h1>
                        </div>
                    </div>

                    <div className="relative flex-1 max-w-sm hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-12 h-14 bg-slate-100 rounded-[1.2rem] border-none font-bold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button variant="ghost" onClick={() => setIsCartOpen(true)} className="md:hidden relative h-14 w-14 rounded-2xl bg-slate-100">
                        <ShoppingCart size={24} />
                        {items?.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-white text-[11px] w-6 h-6 rounded-full flex items-center justify-center font-black">
                                {items.length}
                            </span>
                        )}
                    </Button>
                </header>

                <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b flex gap-3 overflow-x-auto no-scrollbar scroll-smooth min-h-[80px] items-center">
                    {isLoadingProducts ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-10 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl shrink-0" />
                        ))
                    ) : (
                        <>
                            {categories.map((cat: any) => {
                                const isActive = activeCategory === cat;
                                return (
                                    <Button
                                        key={cat}
                                        type="button"
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

                <ScrollArea className="flex-1 p-6 h-180">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-24">
                        {isLoadingProducts ? (
                            Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-[2rem]" />)
                        ) : (
                            filteredProducts.map((product: any) => (
                                <Card
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    className="rounded-[2rem] p-4 border-2 border-transparent hover:border-primary/50 transition-all cursor-pointer group shadow-sm"
                                >
                                    <div className="aspect-square bg-slate-50 rounded-[1.5rem] mb-4 flex items-center justify-center relative overflow-hidden">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="h-48 w-58 object-cover rounded-2xl"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <UtensilsCrossed className="text-slate-300 dark:text-slate-700" size={48} />
                                        )}
                                        <Badge className="absolute top-2 left-2 bg-gray-500/80 text-[8px]">{product.category?.name}</Badge>
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
            <aside className="hidden lg:flex w-[400px] shrink-0 flex-col bg-white dark:bg-slate-900 shadow-2xl border-l z-10">
                <CartItemsList />
            </aside>

            {/* PANIER MOBILE */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetContent side="right" className="p-0 w-full sm:w-[450px]">
                    <CartItemsList />
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