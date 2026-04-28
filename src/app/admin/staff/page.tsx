"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, UserCircle2, Mail, 
  ShieldCheck, MoreVertical, Edit2, Trash2,
  ArrowLeft, Phone
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AddStaffModal } from "./AddStaffModal";
import api from "@/src/lib/axios";
import { ROLE_CONFIG, StaffMember } from "@/src/types/management";
import { EditStaffModal } from "./EditStaffModal";
import { PermissionsModal } from "./PermissionsModal";



export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
// États pour les permissions
  const [permissionMember, setPermissionMember] = useState<StaffMember | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/staff');
      // On s'assure de matcher la structure de UserResource (res.data.data)
      setStaff(res.data.data);
    } catch (error) {
      toast.error("Impossible de charger l'équipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filtrage dynamique côté client
  const filteredStaff = staff.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-20">
      
      {/* HEADER */}
      <header className="max-w-6xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-100" asChild>
              <Link href="/admin"><ArrowLeft size={20} /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                Équipe <span className="text-primary">Staff</span>
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {staff.length} Membres enregistrés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nom, rôle..." 
                className="pl-10 h-12 w-full md:w-64 rounded-2xl bg-white border-none shadow-sm focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <AddStaffModal onStaffAdded={fetchStaff} />
          </div>
        </div>
      </header>

      {/* LISTE DU STAFF */}
      <main className="max-w-6xl mx-auto">
        {loading && staff.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-[2.5rem]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredStaff.map((member) => {
                const config = ROLE_CONFIG[member.role] || { label: member.role, color: "bg-slate-100" };
                
                return (
                  <motion.div
                    key={member.uuid} // Utilisation de l'UUID pour la clé React
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="p-6 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          <UserCircle2 size={32} />
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2">
                            <DropdownMenuItem
                            onClick={() => {
        setSelectedMember(member);
        setIsEditModalOpen(true);
    }}
                            className="gap-2 font-black text-[10px] uppercase cursor-pointer rounded-xl py-3">
                              <Edit2 size={14} /> Modifier Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 font-black text-[10px] uppercase cursor-pointer text-red-600 focus:text-red-600 rounded-xl py-3">
                              <Trash2 size={14} /> Révoquer l'accès
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-1 mb-4">
                        <h3 className="font-black text-xl tracking-tighter uppercase truncate">
                          {member.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={`${config.color} border-none uppercase text-[9px] font-black tracking-widest`}>
                            {config.label}
                          </Badge>
                          <div className={`h-1.5 w-1.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          <span className="text-[9px] font-bold uppercase text-muted-foreground">
                            {member.is_active ? 'En ligne' : 'Inactif'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-dashed border-slate-100">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Mail size={12} />
                          </div>
                          <span className="text-[11px] font-bold truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Phone size={12} />
                          </div>
                          <span className="text-[11px] font-bold">{member.phone || "Non renseigné"}</span>
                        </div>
                      </div>

                      <Button
                      onClick={() => {
    setPermissionMember(member);
    setIsPermissionModalOpen(true);
  }}
                      variant="secondary" className="w-full mt-6 h-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] gap-2 bg-slate-50 hover:bg-slate-900 hover:text-white border-none transition-all duration-300">
                        <ShieldCheck size={14} /> Permissions
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredStaff.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Aucun membre trouvé</p>
          </div>
        )}
        {selectedMember && (
    <EditStaffModal 
        member={selectedMember}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onStaffUpdated={fetchStaff}
    />
)}
{/* Modal des Permissions */}
      {permissionMember && (
        <PermissionsModal 
          member={permissionMember}
          open={isPermissionModalOpen}
          onOpenChange={setIsPermissionModalOpen}
        />
      )}
      </main>
    </div>
  );
}