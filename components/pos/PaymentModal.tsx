"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Delete, 
  CheckCircle2, 
  ArrowLeftCircle 
} from 'lucide-react';
import { useUIStore } from '@/src/store/use-ui-store';
import { useCart } from '@/src/hooks/use-cart';
import { usePrint } from '@/src/hooks/use-print';
import { formatCurrency } from '@/src/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCartStore } from '@/src/store/use-cart-store';
import api from '@/src/lib/axios';

const PAYMENT_METHODS = [
  { id: 1, name: 'Espèces', icon: Banknote, key: 'cash' },
  { id: 2, name: 'MoMo / OM', icon: Smartphone, key: 'mobile_money' },
  { id: 3, name: 'Carte Bancaire', icon: CreditCard, key: 'card' },
] as const;

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'] as const;

export default function PaymentModal() {
  const { isPaymentModalOpen, closePayment, selectedSaleForPayment } = useUIStore();
  const { total: cartTotal, clearCart, items: cartItems } = useCartStore();
  const { printReceipt } = usePrint();
  
  const [amountReceived, setAmountReceived] = useState<string>("0");
  const [selectedMethod, setSelectedMethod] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Détermination de la source de données (Vente existante ou Panier)
  const displayData = useMemo(() => ({
    total: selectedSaleForPayment?.amounts.total ?? cartTotal ?? 0,
    items: selectedSaleForPayment?.items ?? cartItems ?? [],
    reference: selectedSaleForPayment?.reference ?? `TK-${Date.now()}`
  }), [selectedSaleForPayment, cartTotal, cartItems]);

  const changeDue = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - displayData.total);
  }, [amountReceived, displayData.total]);

  // Synchronisation du montant initial à l'ouverture
  useEffect(() => {
    if (isPaymentModalOpen) {
      setAmountReceived(displayData.total.toString());
      setIsProcessing(false);
    }
    console.log(displayData)
     console.log(selectedSaleForPayment)
  }, [isPaymentModalOpen, displayData.total]);

  const handleNumpad = useCallback((val: string) => {
    setAmountReceived(prev => {
      if (val === 'back') {
        return prev.length <= 1 ? "0" : prev.slice(0, -1);
      }
      // Empêcher les zéros inutiles au début
      if (prev === "0" && val !== "00") return val;
      if (prev === "0" && val === "00") return "0";
      return prev + val;
    });
  }, []);

const handleFinalize = async () => {
  const received = parseFloat(amountReceived) || 0;
  const total = displayData.total || 0;
  
  // 1. Validations de surface
  if (received < total) {
    toast.error("Le montant reçu est insuffisant");
    return;
  }

  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
  if (!method) {
    toast.error("Méthode de paiement non reconnue");
    return;
  }

  const uuid = selectedSaleForPayment?.uuid; 
  if (!uuid) {
    toast.error("Référence de commande introuvable");
    return;
  }

  setIsProcessing(true);

  try {
    const payload = {
      payment_method: method.key,
      amount_received: received,
      change_due: Math.max(0, received - total),
    };

    const { data } = await api.post(`/api/pos/orders/${uuid}/finalize`, payload);

    // 2. Gestion de l'impression (try/catch interne optionnel)
    // On attend l'impression, mais on peut aussi ne pas bloquer le succès si l'imprimante échoue
    try {
      await printReceipt({ 
        total: total, 
        items: displayData.items, 
        reference: data.reference || displayData.reference || uuid,
        payment_method: method.name // Info utile pour le ticket
      });
    } catch (printErr) {
      console.warn("Échec impression ticket:", printErr);
      toast.info("Paiement validé, mais l'impression a échoué.");
    }

    toast.success(data.message || "Paiement validé !");
    
    // 3. Reset de l'interface
    if (!selectedSaleForPayment) {
        clearCart();
    }
    closePayment();

  } catch (error: any) {
    console.error("Erreur API Finalize:", error);
    const message = error.response?.data?.message || "Une erreur est survenue lors du paiement";
    toast.error(message);
  } finally {
    setIsProcessing(false);
  }
};

  return (
    <Dialog open={isPaymentModalOpen} onOpenChange={closePayment}>
    <DialogContent className="max-w-[95vw] lg:max-w-[90vw] xl:max-w-[1400px] p-0 overflow-hidden gap-0 flex flex-col md:flex-row h-[95vh] md:h-auto border-none shadow-2xl rounded-[2.5rem]">
        
        {/* --- SECTION GAUCHE : CONFIGURATION --- */}
        <div className="flex-1 p-8 space-y-8 bg-slate-50 dark:bg-slate-900/40">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <div className="h-8 w-2 bg-primary rounded-full" />
              Finaliser l'encaissement
            </DialogTitle>
          </DialogHeader>

          {/* Sélecteur de méthode */}
          <div className="grid grid-cols-3 gap-4">
            {PAYMENT_METHODS.map((method) => {
              const active = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300 group",
                    active 
                      ? "border-primary bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                      : "border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 hover:border-primary/40"
                  )}
                >
                  <method.icon className={cn("h-8 w-8 transition-transform group-hover:scale-110", active ? "text-white" : "text-slate-400")} />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">{method.name}</span>
                  {active && <div className="absolute top-3 right-3 h-2 w-2 bg-white rounded-full animate-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Affichage des montants */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-inner">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Net à percevoir</span>
              <div className="text-6xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">
                {formatCurrency(displayData.total)}
              </div>
            </div>

            <div className="relative group">
              <label className="absolute -top-3 left-8 bg-slate-50 dark:bg-slate-900 px-3 text-[10px] font-black uppercase text-primary tracking-[0.2em] z-10">
                Somme encaissée
              </label>
              <div className="relative">
                <Input 
                  className="text-5xl font-black h-24 text-right pr-10 rounded-[2rem] border-4 border-primary/10 focus-visible:ring-primary bg-white dark:bg-slate-800 italic transition-all" 
                  value={amountReceived}
                  readOnly
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl">€</div>
              </div>
            </div>
          </div>

          {/* Feedback Monnaie */}
          <div className={cn(
            "p-6 rounded-[2rem] transition-all border-2 flex justify-between items-center shadow-sm",
            changeDue > 0 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
              : "bg-slate-200/50 border-transparent text-slate-400 opacity-60"
          )}>
            <div className="flex flex-col">
              <span className="font-black uppercase text-[10px] tracking-widest">Reliquat / Monnaie</span>
              <span className="text-[9px] font-bold italic">À rendre au client</span>
            </div>
            <span className="text-4xl font-black italic tracking-tighter">
              {formatCurrency(changeDue)}
            </span>
          </div>
        </div>

        {/* --- SECTION DROITE : PAVÉ NUMÉRIQUE --- */}
        <div className="w-full md:w-[400px] p-8 bg-white dark:bg-slate-950 border-l border-slate-100 dark:border-slate-800 flex flex-col shadow-2xl">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {NUMPAD_KEYS.map((key) => (
              <Button
                key={key}
                variant="ghost"
                className={cn(
                  "h-20 text-3xl font-black rounded-[1.5rem] border-2 border-slate-50 dark:border-slate-900 hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg transition-all active:scale-90",
                  key === 'back' && "text-red-500 hover:bg-red-500 hover:border-red-500"
                )}
                onClick={() => handleNumpad(key)}
              >
                {key === 'back' ? <Delete size={32} strokeWidth={2.5} /> : key}
              </Button>
            ))}
          </div>

          <div className="mt-auto space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl uppercase font-black tracking-widest text-slate-400 border-2 hover:bg-slate-50 transition-all" 
              onClick={closePayment}
            >
              Abandonner
            </Button>
            
            <Button 
              className={cn(
                "w-full h-24 text-2xl font-black gap-4 rounded-[2rem] shadow-2xl transition-all duration-500 relative overflow-hidden group",
                parseFloat(amountReceived) >= displayData.total 
                  ? "bg-primary hover:bg-primary/90 shadow-primary/40" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
              disabled={parseFloat(amountReceived) < displayData.total || isProcessing}
              onClick={handleFinalize}
            >
              {isProcessing ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>TRAITEMENT...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="h-8 w-8 group-hover:rotate-12 transition-transform" />
                  <span>VALIDER</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}