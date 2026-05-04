import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Product } from "@/src/types/menus";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/src/lib/formatCurrency";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Plus, Minus } from "lucide-react";

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
  // On sépare la logique : un seul choix gratuit, et des suppléments multiples
  const [baseChoice, setBaseChoice] = useState<any | null>(null);
  const [supplements, setSupplements] = useState<any[]>([]);

  // Reset quand on change de produit
  useEffect(() => {
    if (isOpen) {
      setBaseChoice(null);
      setSupplements([]);
    }
  }, [isOpen, product]);

  if (!product || !product.modifiers) return null;

  // Logique pour les suppléments (multiples)
  const toggleSupplement = (item: any) => {
    setSupplements(prev =>
        prev.find(i => i.id === item.id)
            ? prev.filter(i => i.id !== item.id)
            : [...prev, item]
    );
  };
  const updateSupplementQty = (item: any, delta: number) => {
    setSupplements(prev => {
      const existing = prev.find(i => i.id === item.id);

      // Si l'item n'existe pas et qu'on veut ajouter
      if (!existing && delta > 0) {
        return [...prev, { ...item, quantity: 1 }];
      }

      // Si l'item existe, on met à jour sa quantité
      return prev.map(i => {
        if (i.id === item.id) {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(i => i.quantity > 0); // On retire l'item si la qté tombe à 0
    });
  };
  const handleFinalize = () => {
    const finalSelection = [];

    // 1. Gérer l'accompagnement gratuit (Tab 1)
    if (baseChoice) {
      finalSelection.push({
        ...baseChoice,
        price: 0,      // On force la gratuité
        quantity: 1    // On force la quantité à 1 pour le rapport
      });
    }

    // 2. Ajouter les suppléments (Tab 2)
    // Ils ont déjà leur .quantity grâce à updateSupplementQty
    finalSelection.push(...supplements);

    onConfirm(finalSelection);
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

          <Tabs defaultValue="base" className="w-full">
            <TabsList className="grid grid-cols-2 mx-6 bg-slate-100 rounded-xl h-12 p-1">
              <TabsTrigger value="base" className="rounded-lg font-bold text-xs uppercase tracking-widest">
                Accompagnement
              </TabsTrigger>
              <TabsTrigger value="extra" className="rounded-lg font-bold text-xs uppercase tracking-widest">
                Suppléments
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[50vh] mt-4 px-6">
              {/* --- TAB 1 : CHOIX UNIQUE GRATUIT --- */}
              <TabsContent value="base" className="m-0 pb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Choisissez un accompagnement inclus :</p>
                <div className="space-y-2">
                  {product.modifiers[0]?.items.map((item) => (
                      <div
                          key={item.id}
                          onClick={() => setBaseChoice(item)}
                          className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                              baseChoice?.id === item.id ? "border-primary bg-primary/5 shadow-sm" : "border-slate-50 hover:border-slate-200"
                          )}
                      >
                    <span className={cn("font-bold text-sm", baseChoice?.id === item.id && "text-primary")}>
                      {item.name}
                    </span>
                        {baseChoice?.id === item.id ? (
                            <div className="bg-primary text-white rounded-full p-1"><Check size={12} strokeWidth={4} /></div>
                        ) : (
                            <span className="font-bold text-slate-300 text-[10px] uppercase">Inclus</span>
                        )}
                      </div>
                  ))}
                </div>
              </TabsContent>

              {/* --- TAB 2 : SUPPLÉMENTS MULTIPLES --- */}
              <TabsContent value="extra" className="m-0 pb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Ajoutez des extras (payants) :</p>
                <div className="space-y-2">
                  {/* On skip le premier modifier si c'est celui de base, ou on filtre par prix */}
                  {product.modifiers.flatMap(m => m.items).filter(item => item.price > 0).map((item) => {
                    const selectedItem = supplements.find(i => i.id === item.id);
                    const isSelected = !!selectedItem;
                    const quantity = selectedItem?.quantity || 0;

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
          + {formatCurrency(item.price)}
        </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {isSelected ? (
                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-1 border shadow-sm animate-in fade-in zoom-in duration-200">
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500"
                                      onClick={() => updateSupplementQty(item, -1)}
                                  >
                                    <Minus size={14} strokeWidth={3} />
                                  </Button>

                                  <span className="font-black text-sm w-4 text-center">{quantity}</span>

                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                      onClick={() => updateSupplementQty(item, 1)}
                                  >
                                    <Plus size={14} strokeWidth={3} />
                                  </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateSupplementQty(item, 1)}
                                    className="rounded-xl border-2 font-bold px-4 h-10 hover:bg-primary hover:text-white hover:border-primary transition-all"
                                >
                                  Ajouter
                                </Button>
                            )}
                          </div>
                        </div>
                    );
                  })}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button
                disabled={!baseChoice} // Force à choisir un accompagnement
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