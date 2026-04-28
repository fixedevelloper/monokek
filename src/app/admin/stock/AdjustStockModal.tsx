import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStockStore } from "@/src/store/use-stock-store";
import { useState } from "react";
import { toast } from "sonner";

export function AdjustStockModal({ 
  open, 
  onOpenChange, 
  item, 
  type 
}: { 
  open: boolean, 
  onOpenChange: (o: boolean) => void, 
  item: any, 
  type: 'in' | 'out' 
}) {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const { adjustStock } = useStockStore(); // Ajoute cette fonction à ton store

  const handleConfirm = async () => {
    if (!qty || parseFloat(qty) <= 0) return;
    
    try {
      await adjustStock(item.id, {
        qty: parseFloat(qty),
        type: type,
        reason: reason || (type === 'in' ? "Réapprovisionnement manuel" : "Ajustement de perte")
      });
      toast.success("Stock mis à jour !");
      onOpenChange(false);
      setQty("");
      setReason("");
    } catch (e) {
      toast.error("Erreur d'ajustement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase italic tracking-tighter">
            {type === 'in' ? 'Entrée de' : 'Sortie de'} <span className="text-primary">{item?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase ml-2">Quantité ({item?.unit?.name || item?.unit})</label>
            <Input 
              type="number" 
              value={qty} 
              onChange={(e) => setQty(e.target.value)}
              placeholder="0.00" 
              className="text-2xl h-14 font-black rounded-xl border-2 focus:border-primary" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase ml-2">Raison / Note (Optionnel)</label>
            <Input 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Correction inventaire, Perte..." 
              className="rounded-xl h-12" 
            />
          </div>
        </div>

        <Button 
          onClick={handleConfirm}
          className={cn(
            "w-full h-14 rounded-xl font-black uppercase tracking-widest text-lg shadow-lg",
            type === 'in' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700"
          )}
        >
          Confirmer l'{type === 'in' ? 'Entrée' : 'Sortie'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}