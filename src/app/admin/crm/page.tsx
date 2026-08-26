"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Award,
    ArrowLeft,
    Coins,
    Edit2,
    Mail,
    MoreVertical,
    Phone,
    Search,
    Ticket,
    Trash2,
    UserCircle2,
    Users,
    Sparkles,
    CheckCircle2,
    XCircle,
    Printer,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import * as crmApi from "@/src/lib/api/crm";
import { CouponDto, CustomerDto } from "@/src/lib/api/types/crm";
import { formatCurrency } from "@/src/lib/formatCurrency";
import { getErrorMessage } from "@/src/lib/errors";
import { resolveBranchId } from "@/src/lib/branch";
import { AddCustomerModal } from "./AddCustomerModal";
import { EditCustomerModal } from "./EditCustomerModal";
import { CustomerLoyaltySheet } from "./CustomerLoyaltySheet";
import { AddCouponModal } from "./AddCouponModal";

export default function AdminCrmPage() {
    const [customers, setCustomers] = useState<CustomerDto[]>([]);
    const [coupons, setCoupons] = useState<CouponDto[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loyaltyCustomer, setLoyaltyCustomer] = useState<CustomerDto | null>(null);
    const [isLoyaltySheetOpen, setIsLoyaltySheetOpen] = useState(false);
    const [printingCouponId, setPrintingCouponId] = useState<number | null>(null);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setCustomers(await crmApi.listCustomers());
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de charger les clients"));
        } finally {
            setLoading(false);
        }
    };

    const fetchCoupons = async () => {
        try {
            setCoupons(await crmApi.listCoupons());
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de charger les coupons"));
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchCoupons();
    }, []);

    const handlePrintCoupon = async (coupon: CouponDto) => {
        setPrintingCouponId(coupon.id);
        try {
            const branchId = await resolveBranchId();
            if (!branchId) {
                toast.error("Succursale introuvable — vérifiez la configuration du poste.");
                return;
            }
            await crmApi.printCoupon(coupon.id, branchId);
            toast.success("Coupon envoyé à l'impression");
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible d'imprimer ce coupon"));
        } finally {
            setPrintingCouponId(null);
        }
    };

    const handleDeleteCustomer = async (customer: CustomerDto) => {
        if (!confirm(`Supprimer la fiche de ${customer.name} ? Cette action est irréversible.`)) return;

        try {
            await crmApi.deleteCustomer(customer.id);
            toast.success(`Fiche de ${customer.name} supprimée`);
            fetchCustomers();
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de supprimer ce client"));
        }
    };

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 pb-24 selection:bg-primary/10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER BAR */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl bg-white dark:bg-slate-900 shadow-sm border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 transition-all"
                            asChild
                        >
                            <Link href="/admin">
                                <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                    CRM <span className="text-primary bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">Fidélité</span>
                                </h1>
                                <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                                    Pro
                                </Badge>
                            </div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" />
                                <span>{customers.length} {customers.length > 1 ? "clients enregistrés" : "client enregistré"}</span>
                            </p>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTAINER */}
                <main>
                    <Tabs defaultValue="customers" className="space-y-6">

                        {/* TABS SWITCHER */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <TabsList className="bg-slate-200/60 dark:bg-slate-900 p-1 rounded-2xl h-12 w-full sm:w-auto self-start border border-slate-200/50 dark:border-slate-800">
                                <TabsTrigger
                                    value="customers"
                                    className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-wider gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all"
                                >
                                    <UserCircle2 className="h-4 w-4" /> Clients
                                </TabsTrigger>
                                <TabsTrigger
                                    value="coupons"
                                    className="rounded-xl px-6 font-bold uppercase text-[11px] tracking-wider gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all"
                                >
                                    <Ticket className="h-4 w-4" /> Coupons
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* TAB CLIENTS */}
                        <TabsContent value="customers" className="space-y-6 focus-visible:outline-none">

                            {/* BARRE D'ACTIONS CLIENTS */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Rechercher par nom, téléphone..."
                                        className="pl-10 h-11 w-full rounded-2xl bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-sm font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <AddCustomerModal onCustomerAdded={fetchCustomers} />
                            </div>

                            {/* LISTE DES CLIENTS */}
                            {loading && customers.length === 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Card key={i} className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 animate-pulse space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                                                </div>
                                            </div>
                                            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredCustomers.map((customer) => (
                                        <Card
                                            key={customer.id}
                                            className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 bg-white dark:bg-slate-900 group relative flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* CARD HEADER */}
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center font-bold">
                                                            <UserCircle2 className="h-7 w-7" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                                                {customer.name}
                                                            </h3>
                                                            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 uppercase text-[9px] font-extrabold tracking-wider gap-1 px-2 py-0.5 mt-1 rounded-md">
                                                                <Coins className="h-3 w-3" /> {customer.points} PTS
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="rounded-xl h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-1.5 w-44">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedCustomer(customer);
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                                className="gap-2.5 font-semibold text-xs rounded-xl py-2.5 cursor-pointer text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-800"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5 text-slate-500" /> Modifier la fiche
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteCustomer(customer)}
                                                                className="gap-2.5 font-semibold text-xs text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-xl py-2.5 cursor-pointer"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* COORDONNÉES */}
                                                <div className="space-y-2 py-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    <div className="flex items-center gap-2.5">
                                                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{customer.phone || "Non renseigné"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{customer.email || "Non renseigné"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ACTION FIDELITÉ */}
                                            <Button
                                                onClick={() => {
                                                    setLoyaltyCustomer(customer);
                                                    setIsLoyaltySheetOpen(true);
                                                }}
                                                variant="secondary"
                                                className="w-full mt-4 h-11 rounded-xl font-bold uppercase text-[10px] tracking-wider gap-2 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-none"
                                            >
                                                <Award className="h-4 w-4 text-amber-500" /> Espace Fidélité
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* ETAT VIDE CLIENTS */}
                            {!loading && filteredCustomers.length === 0 && (
                                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                                        <UserCircle2 className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Aucun client trouvé</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {searchQuery ? "Aucun résultat pour votre recherche." : "Commencez par ajouter votre premier client."}
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        {/* TAB COUPONS */}
                        <TabsContent value="coupons" className="space-y-6 focus-visible:outline-none">

                            {/* BARRE D'ACTIONS COUPONS */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Coupons de réduction</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Gérez vos codes promo et offres promotionnelles</p>
                                </div>
                                <AddCouponModal onCouponAdded={fetchCoupons} />
                            </div>

                            {/* LISTE DES COUPONS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {coupons.map((coupon) => (
                                    <Card
                                        key={coupon.id}
                                        className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <Ticket className="h-5 w-5" />
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`${
                                                    coupon.expired
                                                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                } uppercase text-[9px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1`}
                                            >
                                                {coupon.expired ? (
                                                    <>
                                                        <XCircle className="h-3 w-3" /> Expiré
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-3 w-3" /> Actif
                                                    </>
                                                )}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code Coupon</span>
                                            <h3 className="font-mono font-black text-xl tracking-wider text-slate-900 dark:text-white uppercase">
                                                {coupon.code}
                                            </h3>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Réduction</span>
                                            <span className="text-lg font-black text-primary">{formatCurrency(coupon.amount)}</span>
                                        </div>

                                        {coupon.minAmount != null && (
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                                                Dès {formatCurrency(coupon.minAmount)} d'achat
                                            </p>
                                        )}

                                        {coupon.expiresAt && (
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                                                Expire le {new Date(coupon.expiresAt).toLocaleDateString("fr-FR")}
                                            </p>
                                        )}

                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                                            Utilisé {coupon.timesUsed} fois{coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}
                                        </p>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={coupon.expired || printingCouponId === coupon.id}
                                            onClick={() => handlePrintCoupon(coupon)}
                                            className="w-full mt-4 h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2"
                                        >
                                            {printingCouponId === coupon.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Printer className="h-3.5 w-3.5" />
                                            )}
                                            Imprimer
                                        </Button>
                                    </Card>
                                ))}
                            </div>

                            {/* ETAT VIDE COUPONS */}
                            {coupons.length === 0 && (
                                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                                        <Ticket className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Aucun coupon disponible</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Créez des coupons pour stimuler vos ventes.
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* MODALES & SHEETS */}
                    {selectedCustomer && (
                        <EditCustomerModal
                            customer={selectedCustomer}
                            open={isEditModalOpen}
                            onOpenChange={setIsEditModalOpen}
                            onCustomerUpdated={fetchCustomers}
                        />
                    )}
                    {loyaltyCustomer && (
                        <CustomerLoyaltySheet
                            customer={loyaltyCustomer}
                            open={isLoyaltySheetOpen}
                            onOpenChange={setIsLoyaltySheetOpen}
                            onPointsChanged={fetchCustomers}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}