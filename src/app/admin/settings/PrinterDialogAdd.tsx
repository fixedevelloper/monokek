import React, { useEffect, useState } from "react";
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
import { Printer, Globe, Usb, Save, PlusCircle, RefreshCw } from "lucide-react";
import {PrinterFormValues} from "../../../types/menus";
import {Branch} from "@/src/types/company";
import { isTauri } from "@tauri-apps/api/core";

interface PrinterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: PrinterFormValues) => void; // Typé ici aussi
    initialData?: Partial<PrinterFormValues>| null;
    branches: Branch[];
    isPending?: boolean;
}

export const PrinterDialog = ({
                                  open,
                                  onOpenChange,
                                  onSubmit,
                                  initialData,
                                  branches,
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
            branch_id: branches[0]?.id ?? 0,
            location: "receipt", // Valeurs par défaut indispensables
            paper_width: "80",
            char_per_line: 42,
            use_beep: true,
            os_printer_name: ""
        }
    });

    const connectionType = watch("connection");

    const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
    const [loadingPrinters, setLoadingPrinters] = useState(false);

    const refreshAvailablePrinters = async () => {
        if (!isTauri()) return;
        setLoadingPrinters(true);
        try {
            const { list_thermal_printers } = await import("tauri-plugin-thermal-printer");
            const printers = await list_thermal_printers();
            setAvailablePrinters(printers.map((p) => p.name));
        } catch (error) {
            console.error("[PrinterDialog] Impossible de lister les imprimantes locales :", error);
        } finally {
            setLoadingPrinters(false);
        }
    };

    useEffect(() => {
        if (open && connectionType === "usb") {
            refreshAvailablePrinters();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, connectionType]);

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    // S'assurer que les champs manquants dans initialData ont des replis
                    branch_id: initialData.branch_id ?? branches[0]?.id ?? 0,
                    location: initialData.location || "receipt",
                    paper_width: initialData.paper_width || "80",
                    use_beep: initialData.use_beep ?? true,
                    char_per_line: initialData.char_per_line || 42,
                    os_printer_name: initialData.os_printer_name || ""
                } as PrinterFormValues);
            } else {
                reset({
                    name: "",
                    type: "escpos",
                    connection: "network",
                    ip: "",
                    port: 9100,
                    branch_id: branches[0]?.id ?? 0,
                    location: "receipt",
                    paper_width: "80",
                    char_per_line: 42,
                    use_beep: true,
                    os_printer_name: ""
                });
            }
        }
    }, [open, initialData, branches, reset]);

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
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Succursale</Label>
                        <Select onValueChange={(v) => setValue("branch_id", Number(v))} value={String(watch("branch_id"))}>
                            <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold">
                                <SelectValue placeholder="Choisir une succursale" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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

                    {connectionType === "usb" && (
                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between ml-1">
                                <Label className="text-[10px] font-black uppercase text-slate-500">Imprimante locale (OS)</Label>
                                <button
                                    type="button"
                                    onClick={refreshAvailablePrinters}
                                    disabled={loadingPrinters}
                                    className="text-slate-400 hover:text-primary transition-colors"
                                >
                                    <RefreshCw size={12} className={loadingPrinters ? "animate-spin" : ""} />
                                </button>
                            </div>
                            {isTauri() ? (
                                <Select onValueChange={(v) => setValue("os_printer_name", v)} value={watch("os_printer_name")}>
                                    <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold">
                                        <SelectValue placeholder={loadingPrinters ? "Recherche..." : "Choisir une imprimante"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl font-bold">
                                        {availablePrinters.length === 0 ? (
                                            <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-400">Aucune imprimante détectée</div>
                                        ) : (
                                            availablePrinters.map((name) => (
                                                <SelectItem key={name} value={name}>{name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="text-[10px] font-bold uppercase text-slate-400 ml-1">
                                    Disponible uniquement depuis l'application de bureau
                                </p>
                            )}
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