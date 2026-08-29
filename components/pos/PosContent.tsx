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
import * as orderingApi from '@/src/lib/api/ordering';
import * as catalogApi from '@/src/lib/api/catalog';
import api from '@/src/lib/axios';
import { AxiosError } from 'axios';
import { CartItem, useCartStore } from '@/src/store/use-cart-store';
import { ModifierModal } from './ModifierModal';
import { toast } from 'sonner';
import { Order, OrderItem, OrderItemModifier, Product, Round } from '@/src/types/menus';
import { getErrorMessage } from '@/src/lib/errors';

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

// Un round n'est éditable que tant qu'il n'est pas encore servi.
// Adapte 'sent' si ton statut "modifiable" a un autre nom côté backend.
const isRoundEditable = (round: Round | null | undefined) => round?.status === 'sent';

interface CartPanelProps {
    tableId: string | null;
    orderId: number | null;
    orderData: Order | null;
    items: CartItem[];
    total: number;
    isSubmittingRound: boolean;
    pendingRoundItemIds: Set<number>;
    onUpdateRoundItemQty: (roundId: number, itemId: number, newQty: number, productId: number, currentQty: number) => void;
    onRemoveRoundItem: (roundId: number, itemId: number) => void;
    onUpdateCartItemQty: (id: string, qty: number) => void;
    onRemoveCartItem: (id: string) => void;
    onRequestBilling: () => void;
}

/**
 * Défini au niveau module (pas dans le corps de PosContent) et mémoïsé :
 * avant, ce panneau était une fonction redéfinie à chaque render de PosContent,
 * donc une nouvelle *identité* de composant à chaque frappe dans la recherche
 * produit — React démontait/remontait tout l'arbre du panier à chaque touche
 * (perte du scroll, du focus, coût de montage complet). Ici, tant que les
 * props ne changent pas (la recherche ne les affecte pas), ce panneau ne
 * se re-render jamais pendant que l'utilisateur tape.
 */
const CartPanel = React.memo(function CartPanel({
    tableId, orderId, orderData, items, total, isSubmittingRound, pendingRoundItemIds,
    onUpdateRoundItemQty, onRemoveRoundItem, onUpdateCartItemQty, onRemoveCartItem, onRequestBilling,
}: CartPanelProps) {
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
                    {activeRounds.map((round: Round) => (
                        <div key={round.id} className="relative group">
                            <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                <span className="bg-white dark:bg-slate-900 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest border rounded-full">
                                    Round {round.round_number}
                                </span>
                            </div>

                            <div className="bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="bg-slate-50/80 dark:bg-slate-800/80 px-5 py-3 border-b flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                        Envoyé à {new Date(round.sent_at ?? Date.now()).toLocaleTimeString('fr-FR', {
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
                                    {round.items?.map((item: OrderItem) => {
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
                                                                onClick={() => onUpdateRoundItemQty(round.id, item.id, item.qty - 1, item.product.id, item.qty)}
                                                            >
                                                                <Minus size={10} />
                                                            </Button>
                                                            <span className="w-5 text-center text-xs font-black">{item.qty}</span>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                disabled={isPending}
                                                                className="h-6 w-6 rounded-full hover:bg-white"
                                                                onClick={() => onUpdateRoundItemQty(round.id, item.id, item.qty + 1, item.product.id, item.qty)}
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
                                                        {item.modifiers?.map((m: OrderItemModifier) => (
                                                            <span key={m.id} className="text-[9px] text-slate-400 font-medium tracking-tight italic">
                                                                + {m.name}
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
                                                            onClick={() => onRemoveRoundItem(round.id, item.id)}
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
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-white" onClick={() => onUpdateCartItemQty(item.id, item.qty - 1)}>
                                                    <Minus size={12} />
                                                </Button>
                                                <span className="w-6 text-center text-xs font-black">{item.qty}</span>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-white" onClick={() => onUpdateCartItemQty(item.id, item.qty + 1)}>
                                                    <Plus size={12} />
                                                </Button>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => onRemoveCartItem(item.id)} className="text-slate-300 hover:text-red-500">
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
                    onClick={onRequestBilling}
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
});

export default function PosContent() {
    const searchParams = useSearchParams();
    const tableId = searchParams.get('table');
    const router = useRouter();

    const {
        initCartForTable, syncOrderId, items, total, orderId,
        clearCart, addItem, removeItem, updateQty, clearStaleOrderId
    } = useCartStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Toutes");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<Product | null>(null);
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
    // Empêche le double-clic / double-tap d'envoyer deux fois le même round
    const [isSubmittingRound, setIsSubmittingRound] = useState(false);
    // Empêche double-clic sur les actions d'édition d'un round déjà envoyé (par item)
    const [pendingRoundItemIds, setPendingRoundItemIds] = useState<Set<number>>(new Set());
    const queryClient = useQueryClient();

    const handleUpdateRoundItemQty = async (roundId: number, itemId: number, newQty: number) => {
        if (pendingRoundItemIds.has(itemId)) return; // anti double-clic

        setPendingRoundItemIds(prev => new Set(prev).add(itemId));
        try {
            // Même raison que dans handleRequestBilling : on écrit la commande
            // renvoyée directement dans le cache plutôt que de refetch
            // ['active-order', tableId], aveugle pour une table virtuelle.
            const order = await orderingApi.updateRoundItemQty(roundId, itemId, newQty);
            queryClient.setQueryData(['active-order', tableId], order);
            syncOrderId(order.id);
            if (newQty === 0) {
                toast.success("Article retiré du round");
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de modifier cet article"));
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
        queryFn: () => orderingApi.getActiveOrder(tableId as string),
        enabled: !!tableId,
    });

    // 2. Charger les produits
    const { data: products = [], isLoading: isLoadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: () => catalogApi.listProductsPos(),
    });

    // Réglage Admin > Réglages > "Vente en stock insuffisant" — si false (défaut), le garde-fou
    // ci-dessous (handleProductClick/handleConfirmModifiers) bloque la sélection d'un produit
    // storable épuisé. Même patron que roomChargeEnabled dans PaymentModal.tsx.
    const { data: allowOversell = false } = useQuery({
        queryKey: ['store-settings', 'allow_oversell'],
        queryFn: async () => {
            const { data } = await api.get('/api/admin/settings');
            return Boolean(data?.allow_oversell);
        },
        staleTime: 5 * 60 * 1000,
    });

    // Quantité déjà engagée pour ce produit sur CETTE commande, tous modificateurs confondus :
    // panier local pas encore envoyé + rounds déjà envoyés mais pas encore payés (le stock, lui,
    // n'est décrémenté côté serveur qu'au paiement — voir ProductStockDeductionListener — donc
    // avant ça, `product.stock_count` ne reflète pas encore ce qui est déjà engagé ici). Compter
    // seulement le panier local (comme avant) laissait passer un round 2 dépassant le stock dès
    // que le round 1 en avait déjà pris une partie.
    const qtyCommittedForProduct = (productId: number) => {
        const inCart = items
            .filter(i => i.product_id === productId)
            .reduce((sum, i) => sum + i.qty, 0);
        const inSentRounds = (activeOrder?.rounds ?? [])
            .filter(r => r.status !== "voided")
            .flatMap(r => r.items ?? [])
            .filter(i => i.product.id === productId)
            .reduce((sum, i) => sum + i.qty, 0);
        return inCart + inSentRounds;
    };

    // Un produit non-"storable" (consumable/service) n'a pas de stock réel à surveiller — même
    // convention que ProductService.deductForSale côté back-end (ne JAMAIS se baser sur
    // `track_stock`, qui n'est positionné nulle part depuis l'admin).
    const wouldExceedStock = (productId: number, productType: string, stockCount: number) =>
        !allowOversell && productType === "storable" && qtyCommittedForProduct(productId) >= stockCount;

    const hasInsufficientStock = (product: Product) =>
        wouldExceedStock(product.id, product.type, product.stock_count);

    // Garde-fous pour les boutons "+" qui n'ajoutent PAS un produit via handleProductClick :
    // augmenter un article déjà dans le panier local ("Nouveau Round") ou déjà envoyé en cuisine
    // ("Round N") contournait complètement le garde-fou stock insuffisant, l'un en restant
    // local, l'autre en appelant directement l'API de mise à jour du round.
    const guardedUpdateCartItemQty = (id: string, qty: number) => {
        const current = items.find(i => i.id === id);
        if (current && qty > current.qty) {
            const product = products.find((p: Product) => p.id === current.product_id);
            if (product && wouldExceedStock(product.id, product.type, product.stock_count)) {
                toast.error(`Stock insuffisant pour ${product.name}`);
                return;
            }
        }
        updateQty(id, qty);
    };

    const guardedUpdateRoundItemQty = (roundId: number, itemId: number, newQty: number, productId: number, currentQty: number) => {
        if (newQty > currentQty) {
            const product = products.find((p: Product) => p.id === productId);
            if (product && wouldExceedStock(product.id, product.type, product.stock_count)) {
                toast.error(`Stock insuffisant pour ${product.name}`);
                return;
            }
        }
        handleUpdateRoundItemQty(roundId, itemId, newQty);
    };

    const orderData = activeOrder ?? null;

    // 3a. Reset du panier UNIQUEMENT si on change réellement de table.
    // Ne dépend que de tableId, jamais de orderData : un refetch en arrière-plan
    // (invalidation ['floors'], focus fenêtre, event temps réel) ne doit jamais
    // vider le round en cours de composition par le serveur.
    useEffect(() => {
        if (tableId) {
            initCartForTable(Number(tableId));
        }
    }, [tableId, initCartForTable]);

    // 3b. Adopte l'orderId renvoyé par le serveur, sans jamais toucher aux items locaux.
    // Utile par ex. si l'order_id devient connu après le premier round envoyé
    // par un autre poste.
    //
    // On ne synchronise plus JAMAIS vers `null` ici : pour une table virtuelle
    // (fallback "Emporter — {branche}", voir DefaultTableProvisioner), le
    // backend fait exprès de ne jamais résoudre de commande active
    // (OrderService#getActiveOrder — chaque visite doit repartir de zéro), donc
    // orderData est toujours null pour ces tables. Un précédent code faisait
    // `syncOrderId(orderData?.id ?? null)` sans condition : à CHAQUE montage/
    // refetch de cette query (y compris un simple reload de page), ça écrasait
    // l'orderId du round en cours de composition — le round suivant repartait
    // donc sans orderId, et le backend créait une toute nouvelle Order au lieu
    // de continuer le ticket ouvert. Les tickets cuisine/bar restaient
    // corrects (indépendants de l'Order), mais l'écran Ventes affichait le
    // round sous un ticket différent de celui qu'on regardait. Une commande
    // déjà payée reste protégée par Order#assertNotPaid côté serveur, qui
    // rejette explicitement tout ajout de round dessus.
    useEffect(() => {
        if (!isLoadingOrder && tableId && orderData?.id) {
            syncOrderId(orderData.id);
        }
    }, [orderData?.id, tableId, isLoadingOrder, syncOrderId]);

    // --- ACTIONS ---

    const handleProductClick = (product: Product) => {
        if (hasInsufficientStock(product)) {
            toast.error(`Stock insuffisant pour ${product.name}`);
            return;
        }
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

    const handleConfirmModifiers = (selectedModifiers: CartItem['modifiers']) => {
        if (!selectedProductForModifiers) return;

        if (hasInsufficientStock(selectedProductForModifiers)) {
            toast.error(`Stock insuffisant pour ${selectedProductForModifiers.name}`);
            return;
        }

        const extraPrice = selectedModifiers.reduce((acc, curr) => acc + curr.price, 0);
        const basePrice = selectedProductForModifiers.price;

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
            productId: item.product_id,
            qty: item.qty,
            modifiers: item.modifiers?.map(m => ({
                modifierItemId: m.id,
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
            let result;
            try {
                result = await orderingApi.sendRound({
                    tableId: Number(tableId),
                    orderId: orderId ?? undefined,
                    items: sanitizedItems,
                    note: ""
                });
            } catch (error) {
                // Un orderId périmé (résidu d'un état persisté avant le correctif de ce bug, ou
                // toute commande fermée entre-temps sans passer par cet écran) fait échouer
                // resolveOrderForSendRound avec 409 (Order#assertOpen : "déjà payée"/"annulée").
                // Plutôt que de laisser le caissier bloqué sur cette table à chaque nouvel essai,
                // ce cas précis est un signal univoque que l'orderId local est mort : on l'écarte
                // (sans toucher aux items, que le caissier n'a pas à ressaisir) et on retente UNE
                // fois sans lui — le back-end repart alors sur la résolution par table, qui ouvre
                // une commande neuve. Vérifié sur le message exact (pas juste le statut 409) :
                // resolveOrderForSendRound renvoie aussi 409 pour "cette commande n'appartient pas
                // à la table indiquée", un tout autre bug qu'il ne faut surtout pas masquer par un
                // retry silencieux qui ouvrirait une commande en double. `orderId != null` exclut
                // aussi le cas où aucun orderId n'était même envoyé (rien à blâmer côté client).
                const conflictMessage = error instanceof AxiosError ? getErrorMessage(error, "") : "";
                const isStaleOrderConflict =
                    error instanceof AxiosError &&
                    error.response?.status === 409 &&
                    orderId != null &&
                    (conflictMessage.includes("déjà payée") || conflictMessage.includes("est annulée"));
                if (!isStaleOrderConflict) {
                    throw error;
                }
                clearStaleOrderId(Number(tableId));
                result = await orderingApi.sendRound({
                    tableId: Number(tableId),
                    items: sanitizedItems,
                    note: ""
                });
            }
            const { order, skippedKitchenItems } = result;

            // On écrit directement la commande retournée dans le cache plutôt que de
            // refetch ['active-order', tableId] (refreshActiveOrder) : pour une table
            // virtuelle, ce refetch renvoie toujours "aucune commande active" (voir le
            // commentaire au-dessus de l'effet de synchro de orderId ci-dessus) et
            // écraserait le round qu'on vient juste d'envoyer.
            queryClient.setQueryData(['active-order', tableId], order);
            syncOrderId(order.id);
            queryClient.invalidateQueries({ queryKey: ['floors'] }); // Peut tourner en arrière-plan
            // Sans ça, l'écran Vente (PosSalesPage) affichait une liste périmée en y naviguant juste
            // après cet envoi : son useQuery(['pos-sales-orders']) hérite du staleTime global de 5min
            // (QueryProvider.tsx) et ne refetch pas au remount tant qu'il n'est pas explicitement
            // invalidé — le refetch déclenché par le SSE ne suffit pas puisque cette page n'est pas
            // montée pendant qu'on est encore sur l'écran de prise de commande.
            queryClient.invalidateQueries({ queryKey: ['pos-sales-orders'] });
            // Même symptôme, même remède pour l'écran Comptoir (tickets de la station Bar) —
            // clé partielle ['comptoir-tickets'] pour matcher ['comptoir-tickets', stationId]
            // quel que soit stationId.
            queryClient.invalidateQueries({ queryKey: ['comptoir-tickets'] });

            if (skippedKitchenItems?.length) {
                // Ces articles ont été enregistrés sur la commande mais n'ont généré aucun ticket
                // (catégorie sans station de cuisine assignée) : sans cet avertissement, ils
                // restent "envoyés" côté serveur sans jamais apparaître en Cuisine/Comptoir.
                toast.warning(
                    `Non envoyé en cuisine : ${skippedKitchenItems.map(i => i.productName).join(', ')}`,
                    { id: loadingToast, description: "Assignez une station de cuisine à leur catégorie dans Réglages.", duration: 8000 }
                );
            } else {
                toast.success("Round envoyé !", { id: loadingToast });
            }

            // Le round vient d'être confirmé et rechargé dans orderData.rounds (section serveur) :
            // on vide le panier local pour éviter que ces items s'affichent en double
            // (une fois dans "Round N" et une fois dans "Nouveau Round") et pour empêcher
            // qu'un nouvel envoi ne les renvoie une seconde fois en cuisine.
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de l'envoi"), { id: loadingToast });
        } finally {
            setIsSubmittingRound(false);
        }
    };

    // --- FILTRAGE ---

    const categories = useMemo(() => {
        const names = products
            .map((p: Product) => p.category?.name)
            .filter((name): name is string => Boolean(name));
        return ["Toutes", ...Array.from(new Set(names))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((p: Product) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === "Toutes" || p.category?.name === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, activeCategory]);

    if (!tableId) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
            <Store size={64} className="mb-4 text-slate-200" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Table non identifiée</h2>
            <Button onClick={() => router.back()}>Choisir une table</Button>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex-col md:flex-row">
            {/* SECTION MENU */}
            <div className="flex-1 md:flex-[2.5] flex flex-col border-r overflow-hidden bg-white dark:bg-slate-950">
                <header className="p-4 md:p-6 border-b flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.back()} className="rounded-2xl h-12 w-12 bg-slate-50">
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
                            {categories.map((cat: string) => {
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
                            filteredProducts.map((product: Product) => (
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
                                                loading="lazy"
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
                <CartPanel
                    tableId={tableId} orderId={orderId} orderData={orderData} items={items} total={total}
                    isSubmittingRound={isSubmittingRound} pendingRoundItemIds={pendingRoundItemIds}
                    onUpdateRoundItemQty={guardedUpdateRoundItemQty} onRemoveRoundItem={handleRemoveRoundItem}
                    onUpdateCartItemQty={guardedUpdateCartItemQty} onRemoveCartItem={removeItem} onRequestBilling={handleRequestBilling}
                />
            </aside>

            {/* PANIER MOBILE */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetContent side="right" className="p-0 w-full sm:w-[450px]">
                    <CartPanel
                        tableId={tableId} orderId={orderId} orderData={orderData} items={items} total={total}
                        isSubmittingRound={isSubmittingRound} pendingRoundItemIds={pendingRoundItemIds}
                        onUpdateRoundItemQty={guardedUpdateRoundItemQty} onRemoveRoundItem={handleRemoveRoundItem}
                        onUpdateCartItemQty={guardedUpdateCartItemQty} onRemoveCartItem={removeItem} onRequestBilling={handleRequestBilling}
                    />
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
