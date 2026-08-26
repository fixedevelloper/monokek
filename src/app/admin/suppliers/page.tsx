
"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Edit2,
    Mail,
    MapPin,
    MoreVertical,
    Phone,
    ShoppingCart,
    Search,
    Trash2,
    Truck,
    UserCircle2,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card} from "@/components/ui/card";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {toast} from "sonner";
import * as suppliersApi from "@/src/lib/api/suppliers";
import {SupplierDto} from "@/src/lib/api/types/suppliers";
import {getErrorMessage} from "@/src/lib/errors";
import {AddSupplierModal} from "./AddSupplierModal";
import {EditSupplierModal} from "./EditSupplierModal";
import {SupplierPurchasesModal} from "./SupplierPurchasesModal";

export default function AdminSuppliersPage() {
    const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierDto | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [purchasesSupplier, setPurchasesSupplier] = useState<SupplierDto | null>(null);
    const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            setSuppliers(await suppliersApi.listSuppliers());
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de charger les fournisseurs"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleDeleteSupplier = async (supplier: SupplierDto) => {
        if (!confirm(`Supprimer la fiche de ${supplier.name} ? Cette action est irréversible.`)) return;

        try {
            await suppliersApi.deleteSupplier(supplier.id);
            toast.success(`Fiche de ${supplier.name} supprimée`);
            fetchSuppliers();
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de supprimer ce fournisseur"));
        }
    };

    const filteredSuppliers = suppliers.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-20">
            {/* HEADER */}
            <header className="max-w-6xl mx-auto mb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-100" asChild>
                        <Link href="/admin"><ArrowLeft size={20} /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                            Fiches <span className="text-primary">Fournisseurs</span>
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {suppliers.length} Fournisseurs enregistrés
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Nom, contact, téléphone..."
                            className="pl-10 h-12 w-full md:w-64 rounded-2xl bg-white border-none shadow-sm focus-visible:ring-primary"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <AddSupplierModal onSupplierAdded={fetchSuppliers} />
                </div>

                {loading && suppliers.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-slate-200 rounded-[2.5rem]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSuppliers.map((supplier) => (
                            <Card key={supplier.id} className="p-6 rounded-[2.5rem] border-none shadow-sm bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                        <Truck size={32} />
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100">
                                                <MoreVertical size={16} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2">
                                            <DropdownMenuItem
                                                onClick={() => { setPurchasesSupplier(supplier); setIsPurchasesModalOpen(true); }}
                                                className="gap-2 font-black text-[10px] uppercase cursor-pointer rounded-xl py-3">
                                                <ShoppingCart size={14} /> Achats
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => { setSelectedSupplier(supplier); setIsEditModalOpen(true); }}
                                                className="gap-2 font-black text-[10px] uppercase cursor-pointer rounded-xl py-3">
                                                <Edit2 size={14} /> Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteSupplier(supplier)}
                                                className="gap-2 font-black text-[10px] uppercase cursor-pointer text-red-600 focus:text-red-600 rounded-xl py-3">
                                                <Trash2 size={14} /> Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <h3 className="font-black text-xl tracking-tighter uppercase truncate">{supplier.name}</h3>
                                    {supplier.contactName && (
                                        <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                            <UserCircle2 size={12} /> {supplier.contactName}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-dashed border-slate-100">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                                            <Phone size={12} />
                                        </div>
                                        <span className="text-[11px] font-bold">{supplier.phone || "Non renseigné"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                                            <Mail size={12} />
                                        </div>
                                        <span className="text-[11px] font-bold truncate">{supplier.email || "Non renseigné"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                                            <MapPin size={12} />
                                        </div>
                                        <span className="text-[11px] font-bold truncate">{supplier.address || "Non renseignée"}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && filteredSuppliers.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Aucun fournisseur trouvé</p>
                    </div>
                )}

                {selectedSupplier && (
                    <EditSupplierModal
                        supplier={selectedSupplier}
                        open={isEditModalOpen}
                        onOpenChange={setIsEditModalOpen}
                        onSupplierUpdated={fetchSuppliers}
                    />
                )}

                {purchasesSupplier && (
                    <SupplierPurchasesModal
                        supplier={purchasesSupplier}
                        open={isPurchasesModalOpen}
                        onOpenChange={setIsPurchasesModalOpen}
                    />
                )}
            </main>
        </div>
    );
}
