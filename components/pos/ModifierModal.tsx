import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {useEffect, useState} from "react";
import {Product, Modifier, ModifierItem} from "@/src/types/menus";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Badge} from "@/components/ui/badge";
import {formatCurrency} from "@/src/lib/formatCurrency";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Check, Minus, Plus} from "lucide-react";

interface SelectedModifierItem extends ModifierItem {
  quantity: number;
}

/** Même formule que ModifierGroupCard.tsx (admin) — juste dupliquée ici pour garder ce composant
 * POS autonome, sans dépendance croisée vers un fichier admin. */
function selectionRuleLabel(group: Modifier) {
  if (group.required) {
    return group.maxSelect != null
        ? `Obligatoire · ${group.minSelect || 1}-${group.maxSelect}`
        : `Obligatoire · min ${group.minSelect || 1}`;
  }
  if (group.maxSelect != null) return `Optionnel · max ${group.maxSelect}`;
  return "Optionnel";
}

/** Même règle que OrderService#validateModifierGroups (back-end) : required force un minimum
 * d'au moins 1, même si minSelect vaut 0 (valeur par défaut du formulaire de groupe) — les deux
 * doivent rester alignés pour qu'un round jugé valide ici ne soit jamais rejeté côté serveur. */
function effectiveMin(group: Modifier) {
  return group.required ? Math.max(group.minSelect, 1) : group.minSelect;
}

export function ModifierModal({
                                product,
                                isOpen,
                                onClose,
                                onConfirm
                              }: {
  product: Product | null,
  isOpen: boolean,
  onClose: () => void,
  onConfirm: (selectedModifiers: SelectedModifierItem[]) => void
}) {
  // Une entrée par groupe de modificateurs (groupId -> items choisis dans CE groupe, avec leur
  // quantité) — remplace l'ancien état à deux catégories fixes (accompagnement/suppléments), qui
  // ne représentait pas la configuration réelle (nombre de groupes variable, régie par
  // group.type/required/minSelect/maxSelect, pas par une position ou un seuil de prix arbitraire).
  const [selections, setSelections] = useState<Record<number, SelectedModifierItem[]>>({});

  useEffect(() => {
    if (isOpen) {
      setSelections({});
    }
  }, [isOpen, product]);

  if (!product || !product.modifiers || product.modifiers.length === 0) return null;

  const groupQty = (group: Modifier) =>
      (selections[group.id] ?? []).reduce((sum, i) => sum + i.quantity, 0);

  const isGroupSatisfied = (group: Modifier) => groupQty(group) >= effectiveMin(group);
  const canConfirm = product.modifiers.every(isGroupSatisfied);

  // Choix unique façon "radio" : sélectionner un item remplace toute sélection précédente dans ce
  // groupe. Réservé aux groupes dont maxSelect vaut exactement 1 — piloté par la config du
  // groupe, jamais par son `type` (un groupe "accompagnement" n'est pas forcément à choix unique,
  // et un groupe "supplément" pourrait l'être).
  const selectSingle = (group: Modifier, item: ModifierItem) => {
    setSelections(prev => ({...prev, [group.id]: [{...item, quantity: 1}]}));
  };

  const updateMultiQty = (group: Modifier, item: ModifierItem, delta: number) => {
    setSelections(prev => {
      const current = prev[group.id] ?? [];
      const existing = current.find(i => i.id === item.id);

      if (delta > 0) {
        // Respecte le plafond du groupe (quantité totale, pas nombre d'items distincts — même
        // convention que qtyByGroup côté OrderService#validateModifierGroups).
        if (group.maxSelect != null && groupQty(group) >= group.maxSelect) {
          return prev;
        }
        if (!existing) {
          return {...prev, [group.id]: [...current, {...item, quantity: 1}]};
        }
      }

      const updated = current
          .map(i => i.id === item.id ? {...i, quantity: Math.max(0, i.quantity + delta)} : i)
          .filter(i => i.quantity > 0);
      return {...prev, [group.id]: updated};
    });
  };

  const handleFinalize = () => {
    if (!canConfirm) return;
    onConfirm(Object.values(selections).flat());
    onClose();
  };

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="rounded-[2.5rem] max-w-md border-none p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-black uppercase italic tracking-tighter text-2xl">
              Options <span className="text-primary">{product.name}</span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[55vh] mt-2 px-6">
            <div className="space-y-8 pb-6">
              {product.modifiers.map((group) => {
                const singleChoice = group.maxSelect === 1;
                const selectedIds = new Set((selections[group.id] ?? []).map(i => i.id));

                return (
                    <div key={group.id}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {group.name}
                        </p>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border-none",
                                group.required ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 text-slate-500"
                            )}
                        >
                          {selectionRuleLabel(group)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((item) => {
                          const selectedItem = (selections[group.id] ?? []).find(i => i.id === item.id);
                          const isSelected = selectedIds.has(item.id);
                          const quantity = selectedItem?.quantity ?? 0;
                          const atGroupLimit = group.maxSelect != null && groupQty(group) >= group.maxSelect;

                          if (singleChoice) {
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => selectSingle(group, item)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                                        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-slate-50 hover:border-slate-200"
                                    )}
                                >
                                  <div className="flex flex-col">
                                    <span className={cn("font-bold text-sm", isSelected && "text-primary")}>
                                      {item.name}
                                    </span>
                                    {item.price > 0 && (
                                        <span className={cn("font-black text-[10px]", isSelected ? "text-primary" : "text-slate-400")}>
                                          + {formatCurrency(item.price)}
                                        </span>
                                    )}
                                  </div>
                                  {isSelected ? (
                                      <div className="bg-primary text-white rounded-full p-1"><Check size={12} strokeWidth={4}/></div>
                                  ) : (
                                      <span className="font-bold text-slate-300 text-[10px] uppercase">
                                        {item.price > 0 ? "Choisir" : "Inclus"}
                                      </span>
                                  )}
                                </div>
                            );
                          }

                          return (
                              <div
                                  key={item.id}
                                  className={cn(
                                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                      isSelected ? "border-primary bg-primary/5" : "border-slate-50"
                                  )}
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">{item.name}</span>
                                  <span className={cn("font-black text-[10px]", isSelected ? "text-primary" : "text-slate-400")}>
                                    {item.price > 0 ? `+ ${formatCurrency(item.price)}` : "Inclus"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  {isSelected ? (
                                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-1 border shadow-sm animate-in fade-in zoom-in duration-200">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500"
                                            onClick={() => updateMultiQty(group, item, -1)}
                                        >
                                          <Minus size={14} strokeWidth={3}/>
                                        </Button>
                                        <span className="font-black text-sm w-4 text-center">{quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={atGroupLimit}
                                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                                            onClick={() => updateMultiQty(group, item, 1)}
                                        >
                                          <Plus size={14} strokeWidth={3}/>
                                        </Button>
                                      </div>
                                  ) : (
                                      <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={atGroupLimit}
                                          onClick={() => updateMultiQty(group, item, 1)}
                                          className="rounded-xl border-2 font-bold px-4 h-10 hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-30"
                                      >
                                        Ajouter
                                      </Button>
                                  )}
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button
                disabled={!canConfirm}
                className="w-full h-16 rounded-[1.5rem] font-black uppercase italic tracking-widest shadow-xl shadow-primary/20"
                onClick={handleFinalize}
            >
              Confirmer la sélection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
