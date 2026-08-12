"use client";

import {useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2, Save, Store} from "lucide-react";
import {toast} from "sonner";
import * as companyApi from "@/src/lib/api/company";
import {Branch} from "@/src/types/company";
import {getErrorMessage} from "@/src/lib/errors";

interface EditBranchModalProps {
    branch: Branch | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditBranchModal({ branch, open, onOpenChange, onSuccess }: EditBranchModalProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!branch) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = String(formData.get('name') ?? '');
        const address = String(formData.get('address') ?? '');
        const phone = String(formData.get('phone') ?? '');

        try {
            await companyApi.updateBranch(branch.id, { name, address, phone });
            toast.success("Succursale mise à jour");
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de la modification"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] border-none shadow-2xl p-10 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold italic flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Store size={20} />
                        </div>
                        Modifier <span className="text-indigo-600">la Succursale</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Nom</Label>
                        <Input name="name" defaultValue={branch?.name} className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" required />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Adresse</Label>
                        <Input name="address" defaultValue={branch?.address ?? ''} className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Téléphone</Label>
                        <Input name="phone" defaultValue={branch?.phone ?? ''} className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all active:scale-95">
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <span className="flex items-center gap-2"><Save size={18} /> Enregistrer</span>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
