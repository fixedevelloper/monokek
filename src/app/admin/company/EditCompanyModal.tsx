"use client";

import {useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Building2, Loader2, Save} from "lucide-react";
import {toast} from "sonner";
import * as companyApi from "@/src/lib/api/company";
import {Company} from "@/src/types/company";
import {getErrorMessage} from "@/src/lib/errors";

interface EditCompanyModalProps {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditCompanyModal({ company, open, onOpenChange, onSuccess }: EditCompanyModalProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!company) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = String(formData.get('name') ?? '');
        const phone = String(formData.get('phone') ?? '');
        const email = String(formData.get('email') ?? '');

        try {
            await companyApi.updateCompany(company.id, { name, phone, email });
            toast.success("Société mise à jour");
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
                            <Building2 size={20} />
                        </div>
                        Modifier <span className="text-indigo-600">la Société</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Raison sociale</Label>
                        <Input name="name" defaultValue={company?.name} className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" required />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Téléphone</Label>
                        <Input name="phone" defaultValue={company?.phone ?? ''} className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-slate-400">Email</Label>
                        <Input name="email" type="email" defaultValue={company?.email ?? ''} className="h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold" />
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
