"use client";

import React from 'react';
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStockStore } from "@/src/store/use-stock-store";
import { toast } from "sonner";

export function AddIngredientModal({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const { units, addIngredient } = useStockStore();
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await addIngredient(data);
      toast.success("Ingrédient ajouté au stock");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
            Nouvel <span className="text-primary">Ingrédient</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase ml-2">Nom de l'article</label>
            <Input {...register("name", { required: true })} placeholder="Ex: Farine de blé" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase ml-2">Unité</label>
              <Select onValueChange={(val) => setValue("unit_id", val)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase ml-2">Stock Initial</label>
              <Input type="number" step="0.01" {...register("stock")} placeholder="0.00" className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase ml-2 text-red-500">Seuil d'alerte (Stock bas)</label>
            <Input type="number" step="0.01" {...register("alert_qty")} placeholder="5.00" className="rounded-xl border-red-100" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
              Enregistrer en stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}