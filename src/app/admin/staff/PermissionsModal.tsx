"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Loader2, Lock, Unlock, Info } from "lucide-react";
import { toast } from "sonner";
import { Permission, StaffMember } from "@/src/types/management";
import api from "@/src/lib/axios";



interface PermissionsModalProps {
    member: StaffMember;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export function PermissionsModal({ member, open, onOpenChange }: PermissionsModalProps) {
    const [loading, setLoading] = useState(false);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    // On charge les permissions actuelles de l'utilisateur quand le modal s'ouvre
    useEffect(() => {
        if (open) {
            // 1. Charger toutes les permissions disponibles
            const fetchData = async () => {
                try {
                    const res = await api.get('/api/admin/staff/permissions/list');
                    setAllPermissions(res.data.data);
                } catch (e) {
                    toast.error("Erreur de chargement des permissions");
                }
            };
            fetchData();
            // 2. Initialiser les permissions actuelles du membre
          setUserPermissions(
  member.permissions?.map(p => p.name) ?? []
);
        }
    }, [open, member]);

    // Groupement dynamique des permissions (ex: par le premier mot du nom)
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        allPermissions.forEach(p => {
            const groupName = p.name.split('_')[0]; // ex: 'orders', 'products'
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(p);
        });
        return groups;
    }, [allPermissions]);

    const handleTogglePermission = (permission: string) => {
        setUserPermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Route à créer dans ton StaffController
            await api.put(`/api/admin/staff/${member.uuid}/permissions`, {
                permissions: userPermissions
            });
            toast.success("Permissions mises à jour avec succès");
            onOpenChange(false);
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-8 max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <span>Droits de </span>
                            <span className="text-primary">{member.name}</span>
                        </div>
                    </DialogTitle>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-1">
                        <Info size={12} /> Ces permissions s'ajoutent à celles du rôle {member.role}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-4">
                    {Object.entries(groupedPermissions).map(([groupName, permissions]) => (
                        <div key={groupName} className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-4 py-2 rounded-lg inline-block border border-primary/10">
                                {groupName}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {permissions.map((perm) => (
                                    <div
                                        key={perm.id}
                                        onClick={() => handleTogglePermission(perm.name)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${userPermissions.includes(perm.name)
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-slate-50 bg-white hover:border-slate-200"
                                            }`}
                                    >
                                        {/* Label dynamique venant du backend */}
                                        <span className="text-xs font-bold uppercase italic">
                                            {perm.label}
                                        </span>
                                        <Checkbox checked={userPermissions.includes(perm.name)} />

                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="mt-6">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-slate-900 hover:bg-black shadow-lg transition-all active:scale-95 gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Appliquer les permissions"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}