"use client";

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, cn } from '@/lib/utils';

interface Modifier {
  id: number;
  name: string;
  price: number;
}

interface ModifierSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  modifiers: Modifier[];
  onConfirm: (selected: Modifier[]) => void;
}

export default function ModifierSelector({ 
  isOpen, 
  onClose, 
  productName, 
  modifiers, 
  onConfirm 
 Suk} : ModifierSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleModifier = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedModifiers = modifiers.filter(m => selectedIds.includes(m.id));
    onConfirm(selectedModifiers);
    setSelectedIds([]); // Reset pour le prochain produit
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-muted/30">
          <DialogTitle className="text-xl font-bold">
            Options : <span className="text-primary">{productName}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Sélectionnez les suppléments ou préférences.</p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-6">
          <div className="grid grid-cols-1 gap-3">
            {modifiers.map((modifier) => {
              const isSelected = selectedIds.includes(modifier.id);
              return (
                <button
                  key={modifier.id}
                  onClick={() => toggleModifier(modifier.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="font-semibold">{modifier.name}</span>
                  </div>
                  
                  {modifier.price > 0 && (
                    <span className={cn(
                      "text-sm font-mono font-bold",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}>
                      + {formatCurrency(modifier.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-muted/30 border-t gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-12">
            Annuler
          </Button>
          <Button onClick={handleConfirm} className="flex-1 h-12 text-lg font-bold">
            Ajouter au panier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}