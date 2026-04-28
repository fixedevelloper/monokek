"use client";

import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Loader2, Search } from 'lucide-react';
import { useStockStore } from "@/src/store/use-stock-store";
import api from "@/src/lib/axios";
import { toast } from "sonner";

export function RecipeSheet({ product, open, onOpenChange }: any) {
  const { ingredients, fetchIngredients } = useStockStore();
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Charger la recette existante au montage
  useEffect(() => {
    if (open && product) {
      fetchIngredients(); // Pour avoir la liste des ingrédients dispos
      api.get(`/api/admin/products/${product.id}/recipe`).then(({ data }) => {
        setRecipeItems(data.items || []);
      });
    }
  }, [open, product]);

  const addItem = () => setRecipeItems([...recipeItems, { ingredient_id: "", qty: 0 }]);
  
  const removeItem = (index: number) => setRecipeItems(recipeItems.filter((_, i) => i !== index));

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...recipeItems];
    newItems[index][field] = value;
    setRecipeItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post(`/api/admin/products/${product.id}/recipe`, { items: recipeItems });
      toast.success("Fiche technique mise à jour");
      onOpenChange(false);
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">
            Fiche <span className="text-primary">Technique</span>
          </SheetTitle>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
            Produit : {product?.name}
          </p>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {recipeItems.map((item, index) => (
            <div key={index} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase ml-1">Ingrédient</label>
                <select 
                  className="w-full h-11 rounded-xl bg-white border-2 border-slate-100 px-3 font-bold text-sm"
                  value={item.ingredient_id}
                  onChange={(e) => updateItem(index, 'ingredient_id', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
              </div>

              <div className="w-24 space-y-2">
                <label className="text-[10px] font-black uppercase ml-1">Qté</label>
                <Input 
                  type="number" 
                  step="0.001"
                  value={item.qty}
                  onChange={(e) => updateItem(index, 'qty', e.target.value)}
                  className="h-11 rounded-xl border-2 font-black italic"
                />
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeItem(index)}
                className="h-11 w-11 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          ))}

          <Button 
            variant="outline" 
            onClick={addItem}
            className="w-full h-12 rounded-2xl border-2 border-dashed border-slate-300 font-bold text-slate-500 gap-2 hover:border-primary hover:text-primary transition-all"
          >
            <Plus size={18} /> Ajouter un ingrédient
          </Button>

          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" /> Enregistrer la fiche</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}