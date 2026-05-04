import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query"; // Import indispensable
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Layers, Save, Loader2, PackageSearch, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";
import {ModifierGroupCard} from "./ModifierGroupCard";

// Typage basique pour TypeScript (optionnel mais recommandé)
interface ModifierItem {
  id: number;
  name: string;
  price: number;
}

interface ModifierGroup {
  id: number;
  name: string;
  items?: ModifierItem[];
}

interface SupplementSheetProps {
  product: any; // Idéalement typer ton produit
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allModifiersGroups: ModifierGroup[];
  isLoadingGroups?: boolean; // Ajouté pour gérer le chargement global
}

export function SupplementSheet({ product, open, onOpenChange, allModifiersGroups }: any) {
  const queryClient = useQueryClient();
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product?.modifiers) {
      setSelectedGroupIds(product.modifiers.map((m: any) => m.id));
    }
  }, [product, open]);

  const toggleGroup = (id: number) => {
    setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post(`/api/admin/products/${product.id}/sync-modifiers`, { modifier_ids: selectedGroupIds });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produit configuré avec succès !");
      onOpenChange(false);
    } catch (error) { toast.error("Erreur de synchro"); }
    finally { setLoading(false); }
  };

  return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[500px] flex flex-col p-0 border-none shadow-2xl overflow-hidden">
          <SheetHeader className="p-8 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-4xl font-black uppercase italic tracking-tighter leading-none">
                Fiche <span className="text-primary text-outline">OPTIONS</span>
              </SheetTitle>
              {selectedGroupIds.length > 0 && (
                  <div className="bg-primary text-white text-[11px] font-black px-3 py-1 rounded-full animate-in zoom-in-50">
                    {selectedGroupIds.length} SÉLECTIONNÉ(S)
                  </div>
              )}
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-3">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                <Layers size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 leading-none tracking-wider">Configuration du produit</p>
                <p className="text-base font-bold text-slate-950">{product?.name || "Produit inconnu"}</p>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 w-full h-160">
            <div className="p-8 space-y-4">
              {allModifiersGroups.map((group: any) => (
                  <ModifierGroupCard
                      key={group.id}
                      group={group}
                      isSelected={selectedGroupIds.includes(group.id)}
                      onToggle={toggleGroup}
                      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['modifier-groups'] })}
                  />
              ))}
            </div>
          </ScrollArea>

          <SheetFooter className="p-8 border-t bg-slate-50/50">
            <Button onClick={handleSave} disabled={loading} className="w-full h-16 rounded-[1.5rem] font-black text-lg gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              ENREGISTRER LA CONFIG
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
  );
}