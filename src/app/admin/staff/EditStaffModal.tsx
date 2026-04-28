"use client";

import { useState, useEffect } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Select, SelectContent, SelectItem, 
    SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Edit3, Mail, Shield, Phone, Loader2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { StaffMember } from "@/src/types/management";
import api from "@/src/lib/axios";

interface EditStaffModalProps {
    member: StaffMember;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStaffUpdated: () => void;
}

export function EditStaffModal({ member, open, onOpenChange, onStaffUpdated }: EditStaffModalProps) {
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<{id: number, name: string}[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>(member.role);

    // Charger les rôles disponibles (même logique que l'ajout)
    useEffect(() => {
        if (open) {
            const fetchRoles = async () => {
                try {
                    const res = await api.get('/api/admin/staff/roles');
                    setRoles(res.data.data);
                } catch (e) { console.error(e); }
            };
            fetchRoles();
            setSelectedRole(member.role); // Reset le rôle sur celui du membre
        }
    }, [open, member]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            ...Object.fromEntries(formData.entries()),
            role: selectedRole,
        };

        try {
            // On utilise l'UUID pour l'URL de l'API
            await api.put(`/api/admin/staff/${member.uuid}`, data);
            
            toast.success(`Profil de ${member.name} mis à jour`);
            onStaffUpdated();
            onOpenChange(false);
        } catch (error: any) {
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((msg: any) => toast.error(msg));
            } else {
                toast.error("Erreur lors de la modification");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2 tracking-tighter">
                        <Edit3 className="text-primary" /> Modifier <span className="text-primary">Staff</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                            <UserCircle2 size={48} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom complet</Label>
                            <Input name="name" defaultValue={member.name} className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Téléphone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input name="phone" defaultValue={member.phone || ""} className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Adresse Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input name="email" type="email" defaultValue={member.email} className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Rôle au sein de Mono-Kek</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-100 border-none font-black uppercase text-[11px] tracking-widest">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl font-bold">
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.name} className="capitalize">
                                        {r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-slate-900 hover:bg-black shadow-lg transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Sauvegarder les modifications"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}