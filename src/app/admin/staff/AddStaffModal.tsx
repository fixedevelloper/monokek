"use client";

import { useEffect, useState } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Select, SelectContent, SelectItem, 
    SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { UserPlus, Mail, Shield, Lock, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/src/lib/axios";

interface AddStaffModalProps {
    onStaffAdded: () => void;
}
interface Role {
    id: number;
    name: string;
}
export function AddStaffModal({ onStaffAdded }: AddStaffModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

const [roles, setRoles] = useState<Role[]>([]); // État pour stocker les rôles de la DB
    const [selectedRole, setSelectedRole] = useState("");

    // Charger les rôles au montage du composant ou à l'ouverture du modal
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await api.get('/api/admin/staff/roles');
                setRoles(res.data.data);
                // Sélectionner le premier rôle par défaut s'il existe
                if (res.data.data.length > 0) {
                    setSelectedRole(res.data.data[0].name);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des rôles", error);
            }
        };

        if (open) fetchRoles();
    }, [open]);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const password = formData.get('password');
        
        // On construit l'objet manuellement pour gérer le rôle et la confirmation
        const payload = {
            ...Object.fromEntries(formData.entries()),
           role: selectedRole,
            password_confirmation: password, // On auto-confirme pour simplifier la création admin
        };

        try {
            await api.post('/api/admin/staff', payload);
            
            toast.success(`Le compte de ${payload.name} a été créé !`);
            setOpen(false);
            onStaffAdded();
            (e.target as HTMLFormElement).reset(); // Reset le formulaire
        } catch (error: any) {
            const errors = error.response?.data?.errors;
            // Gestion propre des erreurs de validation Laravel
            if (errors) {
                Object.values(errors).flat().forEach((msg: any) => toast.error(msg));
            } else {
                toast.error(error.response?.data?.message || "Erreur lors de la création");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-6 rounded-2xl font-black uppercase tracking-[0.1em] text-[11px] gap-2 shadow-xl shadow-primary/20">
                    <UserPlus size={18} /> Inviter
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2 tracking-tighter">
                        <UserPlus className="text-primary" /> Nouveau <span className="text-primary">Membre</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Nom complet</Label>
                            <Input name="name" placeholder="Ex: Jean Dupont" className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Téléphone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input name="phone" placeholder="6xx xxx xxx" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Adresse Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input name="email" type="email" placeholder="email@monokek.com" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Rôle Système</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-100 border-none font-bold">
                                    <SelectValue placeholder="Chargement..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    {roles.map((role) => (
                                        <SelectItem 
                                            key={role.id} 
                                            value={role.name} 
                                            className="font-bold capitalize"
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Pass provisoire</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input name="password" type="password" className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold" required />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Créer le compte staff"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}