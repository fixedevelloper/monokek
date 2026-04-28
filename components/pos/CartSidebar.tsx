"use client";

import React from 'react';
import { Trash2, Plus, Minus, CreditCard, Send, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/src/store/use-ui-store';
import { useCart } from '@/src/hooks/use-cart';
import { formatCurrency } from '@/src/lib/formatCurrency';

export default function CartSidebar() {
  const { items, subtotal, tax, total, updateQty, removeItem, clearCart } = useCart();
  const { openPayment } = useUIStore();

  return (
    <div className="flex flex-col h-full bg-card border-l shadow-xl w-full max-w-[400px]">
      {/* 1. En-tête du Panier */}
      <div className="p-4 flex items-center justify-between bg-muted/50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Commande</h2>
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            {items.reduce((acc, item) => acc + item.qty, 0)}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={clearCart} title="Vider le panier">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* 2. Liste des Articles (Scrollable) */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {items.length > 0 ? (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-2 p-3 rounded-xl bg-accent/30 border border-transparent hover:border-border transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                      {item.variant_name && (
                        <p className="text-xs text-muted-foreground italic">{item.variant_name}</p>
                      )}
                      {item.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.modifiers.map((m) => (
                            <span key={m.id} className="text-[10px] bg-background px-1.5 py-0.5 rounded border">
                              + {m.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-sm ml-2">{formatCurrency(item.price * item.qty)}</p>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-mono font-bold text-sm">{item.qty}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 italic text-sm">
                Aucun article sélectionné
              </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* 3. Résumé et Actions */}
      <div className="p-4 bg-muted/30 border-t flex flex-col gap-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">TVA (19.25%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button variant="outline" className="h-14 flex flex-col gap-1 border-primary/20 hover:bg-primary/5">
            <Send className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold text-primary">Cuisine</span>
          </Button>
          <Button 
            className="h-14 flex flex-col gap-1 shadow-lg shadow-primary/20" 
            onClick={openPayment}
            disabled={items.length === 0}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold">Payer</span>
          </Button>
        </div>
      </div>
    </div>
  );
}