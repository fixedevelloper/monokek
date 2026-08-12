"use client";

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
    ArrowLeft, Building2, ChevronDown, ChevronRight, Mail, MapPin, Monitor,
    MoreVertical, Pencil, Phone, RefreshCcw, Store, Trash2, Wifi
} from 'lucide-react';
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Badge} from "@/components/ui/badge";
import {toast} from 'sonner';
import * as companyApi from '@/src/lib/api/company';
import {Branch, Company, Workstation} from '@/src/types/company';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {getErrorMessage} from '@/src/lib/errors';
import {AddCompanyModal} from './AddCompanyModal';
import {EditCompanyModal} from './EditCompanyModal';
import {AddBranchModal} from './AddBranchModal';
import {EditBranchModal} from './EditBranchModal';
import {AddWorkstationModal} from './AddWorkstationModal';
import {EditWorkstationModal} from './EditWorkstationModal';

export default function AdminCompanyPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [workstations, setWorkstations] = useState<Workstation[]>([]);
    const [loading, setLoading] = useState(true);

    const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null);
    const [expandedBranchId, setExpandedBranchId] = useState<number | null>(null);

    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [editingWorkstation, setEditingWorkstation] = useState<Workstation | null>(null);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [companiesData, branchesData, workstationsData] = await Promise.all([
                companyApi.listCompanies(),
                companyApi.listBranches(),
                companyApi.listWorkstations(),
            ]);
            setCompanies(companiesData);
            setBranches(branchesData);
            setWorkstations(workstationsData);
        } catch (error) {
            toast.error("Erreur lors du chargement de l'organisation");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const toggleCompany = (id: number) => {
        setExpandedCompanyId((current) => (current === id ? null : id));
        setExpandedBranchId(null);
    };
    const toggleBranch = (id: number) => {
        setExpandedBranchId((current) => (current === id ? null : id));
    };

    const handleDeleteCompany = async (company: Company) => {
        const branchCount = branches.filter((b) => b.companyId === company.id).length;
        const warning = branchCount > 0
            ? `Supprimer "${company.name}" supprimera aussi ses ${branchCount} succursale(s) et leurs postes. Continuer ?`
            : `Supprimer la société "${company.name}" ?`;
        if (!confirm(warning)) return;

        try {
            await companyApi.deleteCompany(company.id);
            toast.success('Société supprimée');
            fetchAll();
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de supprimer cette société"));
        }
    };

    const handleDeleteBranch = async (branch: Branch) => {
        const stationCount = workstations.filter((w) => w.branchId === branch.id).length;
        const warning = stationCount > 0
            ? `Supprimer "${branch.name}" supprimera aussi ses ${stationCount} poste(s). Continuer ?`
            : `Supprimer la succursale "${branch.name}" ?`;
        if (!confirm(warning)) return;

        try {
            await companyApi.deleteBranch(branch.id);
            toast.success('Succursale supprimée');
            fetchAll();
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de supprimer cette succursale"));
        }
    };

    const handleDeleteWorkstation = async (workstation: Workstation) => {
        if (!confirm(`Supprimer le poste "${workstation.name}" ?`)) return;

        try {
            await companyApi.deleteWorkstation(workstation.id);
            toast.success('Poste supprimé');
            fetchAll();
        } catch (error) {
            toast.error(getErrorMessage(error, "Impossible de supprimer ce poste"));
        }
    };

    return (
        <div className="flex flex-col gap-10 p-8 max-w-5xl mx-auto min-h-screen text-slate-900">
            {/* Header */}
            <header className="flex flex-col gap-8">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="group w-fit flex items-center gap-3 p-0 hover:bg-transparent"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white transition-all group-hover:bg-slate-900 group-hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Retour</span>
                </Button>

                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-serif font-bold tracking-tight italic">Organisation</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={14} className="text-indigo-500" />
                            Sociétés, succursales et postes de travail
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="icon" onClick={fetchAll} className="h-12 w-12 rounded-2xl">
                            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <AddCompanyModal onSuccess={fetchAll} />
                    </div>
                </div>
            </header>

            {/* List */}
            <div className="grid gap-4">
                {loading ? (
                    <Skeleton className="h-24 w-full rounded-3xl" />
                ) : companies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/30">
                        <Building2 className="text-slate-300 mb-4" size={40} />
                        <p className="text-slate-500 font-medium italic">Aucune société configurée pour le moment.</p>
                    </div>
                ) : companies.map((company) => {
                    const companyBranches = branches.filter((b) => b.companyId === company.id);
                    const isExpanded = expandedCompanyId === company.id;

                    return (
                        <Card key={company.id} className="border-slate-200 rounded-[2rem] overflow-hidden bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => toggleCompany(company.id)}
                                        className="flex items-center gap-5 flex-1 text-left"
                                    >
                                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold uppercase font-serif tracking-tight">{company.name}</h3>
                                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Store size={12} /> {companyBranches.length} succursale(s)
                                                </span>
                                                {company.phone && (
                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                        <Phone size={12} /> {company.phone}
                                                    </span>
                                                )}
                                                {company.email && (
                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                        <Mail size={12} /> {company.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <AddBranchModal companyId={company.id} companyName={company.name} onSuccess={fetchAll} />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-transparent hover:border-slate-200">
                                                    <MoreVertical size={18} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 border-slate-200 shadow-xl">
                                                <DropdownMenuItem onClick={() => setEditingCompany(company)} className="gap-2 py-3 cursor-pointer rounded-lg">
                                                    <Pencil size={14} className="text-slate-500" />
                                                    <span className="font-bold text-xs uppercase tracking-wider">Modifier</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteCompany(company)} className="gap-2 py-3 cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600">
                                                    <Trash2 size={14} />
                                                    <span className="font-bold text-xs uppercase tracking-wider">Supprimer</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <button onClick={() => toggleCompany(company.id)} className="h-10 w-10 flex items-center justify-center text-slate-400">
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-6 pt-6 border-t border-dashed border-slate-200 space-y-3">
                                        {companyBranches.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic text-center py-6">Aucune succursale pour cette société.</p>
                                        ) : companyBranches.map((branch) => {
                                            const branchStations = workstations.filter((w) => w.branchId === branch.id);
                                            const branchExpanded = expandedBranchId === branch.id;

                                            return (
                                                <div key={branch.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <button onClick={() => toggleBranch(branch.id)} className="flex items-center gap-4 flex-1 text-left">
                                                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                                                                <Store size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm uppercase tracking-tight">{branch.name}</p>
                                                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                                    {branch.address && (
                                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                            <MapPin size={10} /> {branch.address}
                                                                        </span>
                                                                    )}
                                                                    <Badge variant="outline" className="text-[9px] font-black px-2 py-0 border-slate-200">
                                                                        <Monitor size={10} className="mr-1" /> {branchStations.length} poste(s)
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </button>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <AddWorkstationModal branchId={branch.id} branchName={branch.name} onSuccess={fetchAll} />
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                                        <MoreVertical size={16} />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44 rounded-xl p-2 border-slate-200 shadow-xl">
                                                                    <DropdownMenuItem onClick={() => setEditingBranch(branch)} className="gap-2 py-2.5 cursor-pointer rounded-lg">
                                                                        <Pencil size={13} className="text-slate-500" />
                                                                        <span className="font-medium text-xs">Modifier</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleDeleteBranch(branch)} className="gap-2 py-2.5 cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600">
                                                                        <Trash2 size={13} />
                                                                        <span className="font-medium text-xs">Supprimer</span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                            <button onClick={() => toggleBranch(branch.id)} className="h-8 w-8 flex items-center justify-center text-slate-400">
                                                                {branchExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {branchExpanded && (
                                                        <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-2">
                                                            {branchStations.length === 0 ? (
                                                                <p className="text-[10px] text-slate-400 italic text-center py-3">Aucun poste configuré.</p>
                                                            ) : branchStations.map((station) => (
                                                                <div key={station.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <Monitor size={14} className="text-indigo-500" />
                                                                        <span className="font-bold text-xs">{station.name}</span>
                                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 uppercase">{station.type}</Badge>
                                                                        {station.ip && (
                                                                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                                                                <Wifi size={10} /> {station.ip}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => setEditingWorkstation(station)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button onClick={() => handleDeleteWorkstation(station)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <EditCompanyModal
                company={editingCompany}
                open={!!editingCompany}
                onOpenChange={(open) => !open && setEditingCompany(null)}
                onSuccess={fetchAll}
            />
            <EditBranchModal
                branch={editingBranch}
                open={!!editingBranch}
                onOpenChange={(open) => !open && setEditingBranch(null)}
                onSuccess={fetchAll}
            />
            <EditWorkstationModal
                workstation={editingWorkstation}
                open={!!editingWorkstation}
                onOpenChange={(open) => !open && setEditingWorkstation(null)}
                onSuccess={fetchAll}
            />
        </div>
    );
}
