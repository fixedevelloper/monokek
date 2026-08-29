"use client";

import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {Loader2, Save} from "lucide-react";
import {toast} from "sonner";
import * as catalogApi from "@/src/lib/api/catalog";
import {Modifier} from "@/src/types/menus";
import {getErrorMessage} from "@/src/lib/errors";

interface ModifierGroupFormModalProps {
    group: Modifier | null; // null = création
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

/** Crée ou reconfigure un groupe de modificateurs — type (Accompagnement/Supplément) +
 * règle de sélection (obligatoire, min/max) appliquée et vérifiée côté serveur au moment
 * d'envoyer la commande (voir OrderService#validateModifierGroups). */
export function ModifierGroupFormModal({group, open, onOpenChange, onSaved}: ModifierGroupFormModalProps) {
    const isEdit = group !== null;
    const [name, setName] = useState("");
    const [type, setType] = useState<"accompaniment" | "supplement">("supplement");
    const [required, setRequired] = useState(false);
    const [minSelect, setMinSelect] = useState("0");
    const [maxSelect, setMaxSelect] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(group?.name ?? "");
        setType(group?.type ?? "supplement");
        setRequired(group?.required ?? false);
        setMinSelect(String(group?.minSelect ?? 0));
        setMaxSelect(group?.maxSelect != null ? String(group.maxSelect) : "");
    }, [open, group]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Le nom du groupe est requis");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: name.trim(),
                type,
                required,
                minSelect: Number(minSelect) || 0,
                maxSelect: maxSelect.trim() ? Number(maxSelect) : undefined,
            };
            if (isEdit) {
                await catalogApi.updateModifier(group.id, payload);
                toast.success("Groupe mis à jour");
            } else {
                await catalogApi.createModifier(payload);
                toast.success("Groupe créé");
            }
            onOpenChange(false);
            onSaved();
        } catch (error) {
            toast.error(getErrorMessage(error, "Échec de l'enregistrement"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-[2rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                        {isEdit ? "Configurer" : "Nouveau"} <span className="text-primary">Groupe</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom du groupe</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Accompagnement, Suppléments"
                               className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold"/>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="accompaniment">Accompagnement (inclus)</SelectItem>
                                <SelectItem value="supplement">Supplément (payant)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 h-14">
                        <div>
                            <p className="text-sm font-bold">Sélection obligatoire</p>
                            <p className="text-[10px] text-muted-foreground">Le client doit choisir au moins une option</p>
                        </div>
                        <Switch checked={required} onCheckedChange={setRequired}/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Minimum</Label>
                            <Input type="number" min={0} value={minSelect} onChange={(e) => setMinSelect(e.target.value)}
                                   className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold"/>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Maximum (vide = illimité)</Label>
                            <Input type="number" min={0} value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)}
                                   placeholder="Illimité" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold"/>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-6">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
                        {isEdit ? "Enregistrer" : "Créer le groupe"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
