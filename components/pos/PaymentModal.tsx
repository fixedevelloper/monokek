"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Banknote,
  Smartphone, SmartphoneCharging,
  CreditCard,
  BedDouble,
  Delete,
  CheckCircle2,
  ArrowLeftCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Tag,
  X,
} from 'lucide-react';
import { useUIStore } from '@/src/store/use-ui-store';
import { useCart } from '@/src/hooks/use-cart';
import { usePrint } from '@/src/hooks/use-print';
import { formatCurrency } from '@/src/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCartStore } from '@/src/store/use-cart-store';
import { finalizePayment, checkRoom, applyCoupon, removeCoupon } from '@/src/lib/api/ordering';
import { getErrorMessage } from '@/src/lib/errors';
import { Order, OrderItem } from '@/src/types/menus';
import api from '@/src/lib/axios';

const ALL_PAYMENT_METHODS = [
  { id: 1, name: 'Espèces', icon: Banknote, key: 'cash' },
  { id: 2, name: 'MoMo', icon: Smartphone, key: 'momo' },
   { id: 4, name: 'OM', icon: SmartphoneCharging, key: 'om' },
  { id: 3, name: 'Carte Bancaire', icon: CreditCard, key: 'card' },
  { id: 5, name: 'Chambre', icon: BedDouble, key: 'room_charge' },
] as const;

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'] as const;

export default function PaymentModal() {
  const { isPaymentModalOpen, closePayment, selectedSaleForPayment } = useUIStore();
  const { total: cartTotal, clearCart, items: cartItems } = useCartStore();
  const { processPrintJob } = usePrint();
  
  const [amountReceived, setAmountReceived] = useState<string>("0");
  const [selectedMethod, setSelectedMethod] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [roomNumber, setRoomNumber] = useState<string>("");
  const [roomLookup, setRoomLookup] = useState<{ bookingId: number; guestName: string } | null>(null);
  const [roomLookupError, setRoomLookupError] = useState<string | null>(null);
  const [isCheckingRoom, setIsCheckingRoom] = useState(false);

  // Copie locale de la commande, mise à jour après application/retrait d'un coupon — on ne peut
  // pas muter selectedSaleForPayment (état global de useUIStore) directement depuis ici.
  const [orderOverride, setOrderOverride] = useState<Order | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isRemovingCoupon, setIsRemovingCoupon] = useState(false);
  const activeOrder = orderOverride ?? selectedSaleForPayment;

  // Le mode "Chambre" ne doit apparaître que si l'établissement a activé
  // l'intégration hôtelière (réglage global, voir admin/settings > Général) —
  // sinon un caissier d'un restaurant sans PMS voit une option qui ne peut
  // jamais aboutir. GET /api/admin/settings est ouvert à tout utilisateur
  // authentifié, pas seulement ADMIN/MANAGER, donc lisible depuis la caisse.
  const { data: roomChargeEnabled = false } = useQuery({
    queryKey: ['store-settings', 'room_charge_enabled'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/settings');
      return Boolean(data?.room_charge_enabled);
    },
    staleTime: 5 * 60 * 1000,
    enabled: isPaymentModalOpen,
  });

  const PAYMENT_METHODS = useMemo(
    () => ALL_PAYMENT_METHODS.filter((m) => m.key !== 'room_charge' || roomChargeEnabled),
    [roomChargeEnabled]
  );

  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
  const isRoomCharge = method?.key === 'room_charge';

  // Toute modification du numéro invalide la vérification précédente — on ne
  // veut jamais facturer sur le nom d'un client vérifié pour un AUTRE numéro.
  const handleRoomNumberChange = (value: string) => {
    setRoomNumber(value);
    setRoomLookup(null);
    setRoomLookupError(null);
  };

  const handleCheckRoom = useCallback(async () => {
    const trimmed = roomNumber.trim();
    if (!trimmed) return;
    setIsCheckingRoom(true);
    setRoomLookup(null);
    setRoomLookupError(null);
    try {
      const result = await checkRoom(trimmed);
      setRoomLookup(result);
    } catch (error) {
      setRoomLookupError(getErrorMessage(error, "Chambre introuvable ou non occupée"));
    } finally {
      setIsCheckingRoom(false);
    }
  }, [roomNumber]);

  // Détermination de la source de données (Vente existante ou Panier)
  const displayData = useMemo(() => ({
    total: activeOrder?.amounts.total ?? cartTotal ?? 0,
    subtotal: activeOrder?.amounts.subtotal ?? cartTotal ?? 0,
    discount: activeOrder?.amounts.discount ?? 0,
    couponCode: activeOrder?.amounts.coupon_code ?? null,
    items: (activeOrder as (Order & { items?: OrderItem[] }) | null)?.items ?? cartItems ?? [],
    reference: activeOrder?.reference ?? `TK-${Date.now()}`
  }), [activeOrder, cartTotal, cartItems]);

  const changeDue = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - displayData.total);
  }, [amountReceived, displayData.total]);

  // Synchronisation du montant initial à l'ouverture
  useEffect(() => {
    if (isPaymentModalOpen) {
      setAmountReceived(displayData.total.toString());
      setIsProcessing(false);
      setRoomNumber("");
      setRoomLookup(null);
      setRoomLookupError(null);
      setSelectedMethod(1);
      setOrderOverride(null);
      setCouponCode("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaymentModalOpen]);

  const handleApplyCoupon = async () => {
    if (!activeOrder?.uuid || !couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const updated = await applyCoupon(activeOrder.uuid, couponCode.trim().toUpperCase());
      setOrderOverride(updated);
      setAmountReceived(updated.amounts.total.toString());
      toast.success(`Coupon ${updated.amounts.coupon_code} appliqué`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Coupon invalide"));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!activeOrder?.uuid) return;
    setIsRemovingCoupon(true);
    try {
      const updated = await removeCoupon(activeOrder.uuid);
      setOrderOverride(updated);
      setAmountReceived(updated.amounts.total.toString());
      setCouponCode("");
      toast.success("Coupon retiré");
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossible de retirer le coupon"));
    } finally {
      setIsRemovingCoupon(false);
    }
  };

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

  if (!method) {
    toast.error("Méthode de paiement non reconnue");
    return;
  }

  if (isRoomCharge && !roomNumber.trim()) {
    toast.error("Le numéro de chambre est requis");
    return;
  }

  if (isRoomCharge && !roomLookup) {
    toast.error("Vérifiez la chambre et confirmez le client avant de facturer");
    return;
  }

  const uuid = activeOrder?.uuid;
  if (!uuid) {
    toast.error("Référence de commande introuvable");
    return;
  }

  setIsProcessing(true);

  try {
    const message = await finalizePayment(uuid, method.key, received, isRoomCharge ? roomNumber.trim() : undefined);

    // 2. Gestion de l'impression (try/catch interne optionnel)
    // On attend l'impression, mais on peut aussi ne pas bloquer le succès si l'imprimante échoue
/*
    try {
      await processPrintJob({
        total: total,
        items: displayData.items,
        reference: displayData.reference || uuid,
        payment_method: method.name // Info utile pour le ticket
      });
    } catch (printErr) {
      console.warn("Échec impression ticket:", printErr);
      toast.info("Paiement validé, mais l'impression a échoué.");
    }
*/

    toast.success(message || "Paiement validé !");
    
    // 3. Reset de l'interface
    if (!selectedSaleForPayment) {
        clearCart();
    }
    closePayment();

  } catch (error) {
    console.error("Erreur API Finalize:", error);
    toast.error(getErrorMessage(error, "Une erreur est survenue lors du paiement"));
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
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
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

          {/* Numéro de chambre (paiement "Chambre" uniquement) */}
          {isRoomCharge && (
            <div className="space-y-3">
              <div className="relative group flex gap-3 items-stretch">
                <div className="flex-1 relative">
                  <label className="absolute -top-3 left-8 bg-slate-50 dark:bg-slate-900 px-3 text-[10px] font-black uppercase text-primary tracking-[0.2em] z-10">
                    N° de chambre
                  </label>
                  <Input
                    className="text-3xl font-black h-16 text-center rounded-[2rem] border-4 border-primary/10 focus-visible:ring-primary bg-white dark:bg-slate-800 italic transition-all"
                    value={roomNumber}
                    onChange={(e) => handleRoomNumberChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCheckRoom(); } }}
                    placeholder="Ex: 204"
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleCheckRoom}
                  disabled={!roomNumber.trim() || isCheckingRoom}
                  className="h-auto px-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shrink-0"
                >
                  {isCheckingRoom ? <Loader2 className="h-5 w-5 animate-spin" /> : "Vérifier"}
                </Button>
              </div>

              {/* Confirmation du client trouvé — le caissier doit voir CE nom avant de facturer,
                  pas juste un numéro de chambre qu'il a peut-être mal tapé/deviné. */}
              {roomLookup && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Chambre occupée par</p>
                    <p className="font-black text-lg italic">{roomLookup.guestName}</p>
                  </div>
                </div>
              )}
              {roomLookupError && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/20 text-red-600">
                  <ShieldAlert className="h-6 w-6 shrink-0" />
                  <p className="font-bold text-sm">{roomLookupError}</p>
                </div>
              )}
            </div>
          )}

          {/* Coupon de réduction — seulement pour une vraie commande (pas le panier ad-hoc, qui
              n'a pas encore d'uuid backend tant qu'elle n'est pas envoyée). */}
          {activeOrder?.uuid && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase ml-1 flex items-center gap-1 text-primary tracking-[0.2em]">
                <Tag size={12} /> Coupon de réduction
              </label>
              {displayData.couponCode ? (
                <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 px-5 h-14">
                  <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">{displayData.couponCode} appliqué</span>
                  <Button
                    type="button" size="sm" variant="ghost" disabled={isRemovingCoupon}
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:bg-red-500/10 h-9 gap-1 font-black text-[10px] uppercase"
                  >
                    {isRemovingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X size={14} />} Retirer
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                    placeholder="Code coupon"
                    className="h-14 rounded-2xl border-4 border-primary/10 focus-visible:ring-primary bg-white dark:bg-slate-800 font-black uppercase"
                  />
                  <Button
                    type="button" disabled={isApplyingCoupon || !couponCode.trim()}
                    onClick={handleApplyCoupon}
                    className="h-14 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shrink-0"
                  >
                    {isApplyingCoupon ? <Loader2 className="h-5 w-5 animate-spin" /> : "Appliquer"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Affichage des montants */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-inner">
              {displayData.discount > 0 && (
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-dashed border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sous-total</span>
                  <span className="font-bold text-slate-500">{formatCurrency(displayData.subtotal)}</span>
                </div>
              )}
              {displayData.discount > 0 && (
                <div className="flex justify-between items-center mb-3 text-emerald-600">
                  <span className="text-[10px] font-black uppercase tracking-widest">Remise</span>
                  <span className="font-black">- {formatCurrency(displayData.discount)}</span>
                </div>
              )}
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
                parseFloat(amountReceived) >= displayData.total && (!isRoomCharge || roomLookup)
                  ? "bg-primary hover:bg-primary/90 shadow-primary/40"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
              disabled={parseFloat(amountReceived) < displayData.total || (isRoomCharge && !roomLookup) || isProcessing}
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