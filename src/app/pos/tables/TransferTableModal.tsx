"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoveRight, Table as TableIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Table {
  id: number;
  name: string;
  zone: string;
  status: string;
}

interface TransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: Table;
  availableTables: Table[];
  onConfirm: (fromId: number, toId: number) => void;
}

export default function TransferTableModal({ 
  isOpen, onClose, currentTable, availableTables, onConfirm 
}: TransferTableModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleTransfer = () => {
    if (selectedId) {
      onConfirm(currentTable.id, selectedId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none">
        <DialogHeader className="p-6 bg-primary text-primary-foreground">
          <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase italic">
            <MoveRight className="h-6 w-6" /> Transfert de Table
          </DialogTitle>
          <p className="text-xs opacity-80 font-bold uppercase tracking-widest mt-1">
            Déplacer la commande de {currentTable.name}
          </p>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <h3 className="text-xs font-black uppercase text-muted-foreground tracking-tighter">
            Sélectionner la table de destination :
          </h3>
          
          <ScrollArea className="h-64 pr-4">
            <div className="grid grid-cols-2 gap-3">
              {availableTables.filter(t => t.id !== currentTable.id).map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedId(table.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all",
                    selectedId === table.id 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-muted bg-card hover:border-primary/30"
                  )}
                >
                  <TableIcon className={cn("h-6 w-6 mb-2", selectedId === table.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-black text-lg">{table.name}</span>
                  <span className="text-[10px] uppercase font-bold opacity-60">{table.zone}</span>
                  
                  {selectedId === table.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 bg-muted/30 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 font-bold uppercase text-xs h-12">
            Annuler
          </Button>
          <Button 
            disabled={!selectedId} 
            onClick={handleTransfer}
            className="flex-1 font-black uppercase text-xs h-12 shadow-lg shadow-primary/20"
          >
            Confirmer le transfert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}