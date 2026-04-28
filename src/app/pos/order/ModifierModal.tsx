import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox"; // Assure-toi d'avoir ce composant shadcn
import { useState } from "react";
import { Product } from "@/src/types/menus";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/src/lib/formatCurrency";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ModifierModal({ 
  product, 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  product: Product | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (selectedModifiers: any[]) => void 
}) {
  const [selected, setSelected] = useState<any[]>([]);

  if (!product || !product.modifiers) return null;

  const toggleModifier = (item: any) => {
    setSelected(prev => 
      prev.find(i => i.id === item.id) 
        ? prev.filter(i => i.id !== item.id) 
        : [...prev, item]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[2.5rem] max-w-md border-none p-6">
        <DialogHeader>
          <DialogTitle className="font-black uppercase italic italic tracking-tighter text-2xl">
            Personnaliser <span className="text-primary">{product.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] mt-4 pr-4">
          {product.modifiers.map((mod) => (
            <div key={mod.id} className="mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{mod.name}</h4>
              <div className="space-y-2">
                {mod.items.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => toggleModifier(item)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                      selected.find(i => i.id === item.id) ? "border-primary bg-primary/5" : "border-slate-50"
                    )}
                  >
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="font-black text-primary text-xs">
                      {item.price > 0 ? `+ ${formatCurrency(item.price)}` : "Gratuit"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button 
            className="w-full h-14 rounded-2xl font-black uppercase" 
            onClick={() => {
              onConfirm(selected);
              setSelected([]);
              onClose();
            }}
          >
            Ajouter au panier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}