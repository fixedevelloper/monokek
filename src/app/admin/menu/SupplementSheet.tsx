import React, {useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query"; // Import indispensable
import {Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Layers, Loader2, Plus, Save} from "lucide-react";
import {toast} from "sonner";
import * as catalogApi from "../../../lib/api/catalog";
import {ModifierGroupCard} from "./ModifierGroupCard";
import {ModifierGroupFormModal} from "./ModifierGroupFormModal";
import {Modifier, Product} from "../../../types/menus";

interface SupplementSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allModifiersGroups: Modifier[];
  isLoadingGroups?: boolean; // Ajouté pour gérer le chargement global
}

export function SupplementSheet({ product, open, onOpenChange, allModifiersGroups }: SupplementSheetProps) {
  const queryClient = useQueryClient();
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Modifier | null>(null);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);

  useEffect(() => {
    if (open && product?.modifiers) {
      setSelectedGroupIds(product.modifiers.map((m) => m.id));
    }
  }, [product, open]);

  const toggleGroup = (id: number) => {
    setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!product) return;
    setLoading(true);
    try {
      await catalogApi.syncModifiers(product.id, selectedGroupIds);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produit configuré avec succès !");
      onOpenChange(false);
    } catch (error) { toast.error("Erreur de synchro"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* SheetContent's base classes set the width as `data-[side=right]:sm:max-w-sm` (384px) —
            overriding with a bare `sm:max-w-[500px]` doesn't work: twMerge only dedupes utilities
            sharing the exact same variant chain, and `sm:` alone isn't recognized as the same
            chain as `data-[side=right]:sm:`, so both classes survived and the narrower one won
            the CSS cascade, clipping every group card's right-side buttons (overflow-hidden on
            this same element). Must match the base class's exact variant prefix to actually win. */}
        <SheetContent className="data-[side=right]:sm:max-w-[500px] flex flex-col p-0 border-none shadow-2xl overflow-hidden">
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

            <Button
                variant="outline"
                onClick={() => { setEditingGroup(null); setIsGroupFormOpen(true); }}
                className="w-full mt-3 h-11 rounded-2xl border-2 border-dashed font-bold text-xs gap-2"
            >
              <Plus size={14}/> Nouveau groupe
            </Button>

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
              {allModifiersGroups.map((group) => (
                  <ModifierGroupCard
                      key={group.id}
                      group={group}
                      isSelected={selectedGroupIds.includes(group.id)}
                      onToggle={toggleGroup}
                      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['modifier-groups'] })}
                      onEditConfig={() => { setEditingGroup(group); setIsGroupFormOpen(true); }}
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

      <ModifierGroupFormModal
          group={editingGroup}
          open={isGroupFormOpen}
          onOpenChange={setIsGroupFormOpen}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['modifier-groups'] })}
      />
    </>
  );
}