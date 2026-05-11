import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Printer, Globe, Usb, Save, PlusCircle } from "lucide-react";
import {PrinterFormValues} from "../../../types/menus";

// 1. Définir l'interface précise pour les champs du formulaire


interface PrinterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: PrinterFormValues) => void; // Typé ici aussi
    initialData?: Partial<PrinterFormValues>| null;
    isPending?: boolean;
}

export const PrinterDialog = ({
                                  open,
                                  onOpenChange,
                                  onSubmit,
                                  initialData,
                                  isPending
                              }: PrinterDialogProps) => {

    // 2. Passer l'interface à useForm
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PrinterFormValues>({
        defaultValues: {
            name: "",
            type: "escpos",
            connection: "network",
            ip: "",
            port: 9100,
            branch_id: 1,
            location: "receipt", // Valeurs par défaut indispensables
            paper_width: "80",
            char_per_line: 42,
            use_beep: true
        }
    });

    const connectionType = watch("connection");

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    // S'assurer que les champs manquants dans initialData ont des replis
                    location: initialData.location || "receipt",
                    paper_width: initialData.paper_width || "80",
                    use_beep: initialData.use_beep ?? true,
                    char_per_line: initialData.char_per_line || 42
                } as PrinterFormValues);
            } else {
                reset({
                    name: "",
                    type: "escpos",
                    connection: "network",
                    ip: "",
                    port: 9100,
                    branch_id: 1,
                    location: "receipt",
                    paper_width: "80",
                    char_per_line: 42,
                    use_beep: true
                });
            }
        }
    }, [open, initialData, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden">
                <DialogHeader className="space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <Printer size={28} />
                    </div>
                    <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                        {initialData ? "Modifier l'imprimante" : "Nouvelle Imprimante"}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-slate-400">
                        Configurez les paramètres de connexion ESC/POS pour votre établissement.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom de l'équipement</Label>
                            <Input
                                {...register("name", { required: true })}
                                placeholder="ex: CUISINE PIZZA"
                                className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 focus-visible:ring-primary font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Destination (Location)</Label>
                            <Select
                                onValueChange={(v) => setValue("location", v)}
                                value={watch("location")}
                            >
                                <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold italic">
                                    <SelectValue placeholder="Affectation..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    <SelectItem value="receipt">Caisse (Reçu)</SelectItem>
                                    <SelectItem value="kitchen">Cuisine</SelectItem>
                                    <SelectItem value="bar">Bar</SelectItem>
                                    <SelectItem value="pizza">Pizzeria</SelectItem>
                                    <SelectItem value="delivery">Livraison</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Usage</Label>
                            <Select onValueChange={(v) => setValue("type", v)} value={watch("type")}>
                                <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    <SelectItem value="escpos">Thermique (Standard)</SelectItem>
                                    <SelectItem value="label">Étiquettes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Interface</Label>
                            <Select onValueChange={(v) => setValue("connection", v)} value={watch("connection")}>
                                <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    <SelectItem value="network">
                                        <div className="flex items-center gap-2 uppercase text-[10px]"><Globe size={14}/> Réseau (IP)</div>
                                    </SelectItem>
                                    <SelectItem value="usb">
                                        <div className="flex items-center gap-2 uppercase text-[10px]"><Usb size={14}/> USB Local</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {connectionType === "network" && (
                        <div className="grid grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Adresse IP</Label>
                                <Input
                                    {...register("ip", { required: connectionType === "network" })}
                                    placeholder="192.168.1.50"
                                    className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-mono font-bold text-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Port</Label>
                                <Input
                                    type="number"
                                    {...register("port", { valueAsNumber: true })}
                                    className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Largeur (mm)</Label>
                            <Select onValueChange={(v) => setValue("paper_width", v)} value={watch("paper_width")}>
                                <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-10 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    <SelectItem value="80">80mm</SelectItem>
                                    <SelectItem value="58">58mm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Caract./Ligne</Label>
                            <Input
                                type="number"
                                {...register("char_per_line", { valueAsNumber: true })}
                                placeholder="42"
                                className="rounded-2xl border-slate-100 bg-slate-50/50 h-10 font-bold"
                            />
                        </div>
                        <div className="flex flex-col items-center justify-center space-y-1">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Bip Sonore</Label>
                            <div
                                onClick={() => setValue("use_beep", !watch("use_beep"))}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${watch("use_beep") ? 'bg-primary' : 'bg-slate-200'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full transition-transform ${watch("use_beep") ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full rounded-[1.5rem] h-14 font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {isPending ? "Traitement..." : (
                                <span className="flex items-center gap-2">
                                    {initialData ? <Save size={18}/> : <PlusCircle size={18}/>}
                                    {initialData ? "Mettre à jour" : "Enregistrer l'imprimante"}
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};