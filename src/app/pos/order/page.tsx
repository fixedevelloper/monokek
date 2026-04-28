"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Search, Utensils, ShoppingCart,
  Trash2, Minus, Plus, Store, Loader2, CreditCard,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Product } from "@/src/types/menus";
import { useCartStore } from "@/src/store/use-cart-store";
import api from "@/src/lib/axios";
import { ModifierModal } from "./ModifierModal";

const ALL_CATEGORIES = "TOUT";

const formatCurrency = (price: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR",
  }).format(price);
};

export default function PosPage() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('table');
  const router = useRouter();

  const { items, addItem, removeItem, updateQty, clearCart, total } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Dans PosPage
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<Product | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);

  // Modifier la fonction de clic sur le produit
  const handleProductClick = (product: Product) => {
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

    // Calcul du prix total avec modifiers
    const extraPrice = selectedModifiers.reduce((acc, curr) => acc + parseFloat(curr.price), 0);

    addItem({
      product_id: selectedProductForModifiers.id,
      name: selectedProductForModifiers.name,
      price: selectedProductForModifiers.price + extraPrice,
      qty: 1,
      modifiers: selectedModifiers,
      instructions: ""
    });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/pos/products");
        setProducts(res.data.data);
      } catch (error) { toast.error("Erreur API"); } finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    return [ALL_CATEGORIES, ...Array.from(new Set(products.map(p => p.category.name)))];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === ALL_CATEGORIES || p.category.name === activeCategory;
    return matchesSearch && matchesCategory;
  });

const handleRequestBilling = async () => {
  if (items.length === 0) return toast.error("Le panier est vide");
  
  const loadingToast = toast.loading("Envoi en cours...");
  
  try {
    const payload = {
      table_id: tableId,
      subtotal: total,
      total: total,
      items: items.map(item => ({
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
        // On mappe les modificateurs pour ne garder que l'ID et le prix
        modifiers: item.modifiers?.map(m => ({
          modifier_item_id: m.id,
          price: m.price
        })) || []
      })),
      status: 'pending',
    };

    await api.post('/api/pos/orders/request-bill', payload);
    
    toast.success("Commande envoyée en cuisine !", { id: loadingToast });
    clearCart();
    router.push('/pos/tables');
  } catch (error) {
    console.error("Billing Error:", error);
    toast.error("Erreur lors de l'envoi", { id: loadingToast });
  }
};

  // --- VUE PANIER RÉUTILISABLE ---
  const CartItemsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex justify-between items-center bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <ShoppingCart size={20} />
          </div>
          <h2 className="font-black uppercase italic tracking-tighter text-xl">Détails Panier</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={clearCart} className="rounded-full text-slate-400 hover:text-red-500">
          <Trash2 size={18} />
        </Button>
      </div>

     <ScrollArea className="flex-1 min-h-0 px-4 [&>[data-radix-scroll-area-viewport]]:scroll-smooth">
        {items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
            <Utensils size={48} className="mb-4" />
            <p className="font-bold uppercase text-[10px] tracking-widest">Le panier est vide</p>
          </div>
        ) : (
          <div className="space-y-4 py-6">
            {items.map((item) => (
              <div key={item.product_id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 group transition-all">
                <div className="flex justify-between mb-3">
                  <span className="font-black text-sm uppercase italic leading-tight max-w-[70%]">{item.name}</span>
                  <span className="font-black text-sm text-primary">{formatCurrency(item.price * item.qty)}</span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.modifiers.map((m: any) => (
                      <span key={m.id} className="text-[9px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md uppercase">
                        + {m.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-full p-1 shadow-sm border">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => updateQty(item.product_id.toString(), item.qty - 1)}><Minus size={14} /></Button>
                    <span className="w-8 text-center text-xs font-black">{item.qty}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => updateQty(item.product_id.toString(), item.qty + 1)}><Plus size={14} /></Button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.product_id.toString())} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></Button>
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
              <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">Montant Total</span>
              <span className="text-[9px] text-slate-400 font-medium italic">Taxes incluses</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                {formatCurrency(total).split(',')[0]}
              </span>
              <span className="text-lg font-black italic text-primary">
                ,{formatCurrency(total).split(',')[1] || "00"}
              </span>
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
            <span>Envoyer en cuisine</span>
            <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ChevronRight size={18} />
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

  if (!tableId) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center">
        <Store size={64} className="mx-auto mb-4 text-slate-200" />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Table non identifiée</h2>
        <Button onClick={() => router.push('/pos/tables')} className="rounded-2xl h-14 px-8 font-black uppercase">Choisir une table</Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex-col md:flex-row">

      {/* --- MENU SECTION --- */}
      <div className="flex-1 md:flex-[2.5] flex flex-col border-r shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        {/* --- HEADER --- */}
        <header className="p-4 md:p-6 bg-white dark:bg-slate-900 border-b flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/pos/tables')}
              className="rounded-2xl h-12 w-12 bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ChevronLeft size={24} />
            </Button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] leading-none mb-1 ml-1">Terminal de commande</span>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                Table <span className="text-primary text-4xl ml-1">{tableId}</span>
              </h1>
            </div>
          </div>

          <div className="relative flex-1 max-w-sm hidden lg:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Rechercher par nom ou code..."
              className="pl-12 h-14 bg-slate-100 dark:bg-slate-800 border-none rounded-[1.2rem] font-bold text-base focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Mobile Cart Trigger */}
          <Button
            variant="ghost"
            onClick={() => setIsCartOpen(true)}
            className="md:hidden relative h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent active:border-primary"
          >
            <ShoppingCart size={24} />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[11px] w-7 h-7 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 font-black animate-in zoom-in">
                {items.length}
              </span>
            )}
          </Button>
        </header>

        {/* --- CATEGORIES BAR (Ultra Stable) --- */}
        {/* --- CATEGORIES BAR --- */}
        <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b flex gap-3 overflow-x-auto no-scrollbar scroll-smooth min-h-[80px] items-center">
          {loading ? (
            // Affichage d'états de chargement pour les catégories
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl shrink-0" />
            ))
          ) : (
            <>
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <Button
                    key={cat}
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

        {/* --- PRODUCT GRID --- */}
        <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-950">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-28">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-64 bg-white dark:bg-slate-900 animate-pulse rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800" />
              ))
            ) : (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden border-2 border-white dark:border-slate-900 hover:border-primary/40 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all active:scale-[0.97] group rounded-[2.5rem] bg-white dark:bg-slate-900 cursor-pointer flex flex-col"
                  // onClick={() => addItem({ product_id: product.id, name: product.name, price: product.price, qty: 1, modifiers: [], instructions: "" })}
                  onClick={() => handleProductClick(product)}
                >
                  {/* Image Placeholder area */}
                  <div className="aspect-[4/3] bg-slate-100/50 dark:bg-slate-800/50 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Utensils className="text-slate-200 dark:text-slate-700 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" size={64} />

                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-none text-[8px] font-black uppercase px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-md">
                        {product.category.name}
                      </Badge>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex flex-col gap-1">
                    <h3 className="font-black text-sm uppercase leading-tight truncate italic text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <p className="text-primary font-black text-2xl italic tracking-tighter">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <aside className="hidden lg:flex w-[400px] shrink-0 flex-col h-full bg-white dark:bg-slate-900 shadow-2xl border-l z-10">
        <CartItemsList />
      </aside>

      {/* --- MOBILE DRAWER (Controlled) --- */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="p-0 w-full sm:w-[450px] border-none">
          <CartItemsList />
        </SheetContent>
      </Sheet>

      {/* --- FLOAT BUTTON MOBILE --- */}
      {items.length > 0 && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="w-full h-16 rounded-[2rem] bg-primary shadow-2xl flex justify-between px-8 font-black uppercase italic tracking-widest border-4 border-white dark:border-slate-900"
          >
            <span className="flex items-center gap-2"><ShoppingCart size={20} /> {items.length} Plats</span>
            <span className="bg-white/20 px-3 py-1 rounded-lg">{formatCurrency(total)}</span>
          </Button>
        </div>
      )}
      <ModifierModal
        product={selectedProductForModifiers}
        isOpen={isModifierModalOpen}
        onClose={() => setIsModifierModalOpen(false)}
        onConfirm={handleConfirmModifiers}
      />
    </div>
  );
}