'use client'

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Users, Clock, Plus, MoreHorizontal, RefreshCcw, ArrowLeft, Trash2, Pencil, ExternalLink, Layers } from "lucide-react";
import { Floor, Table } from '@/src/types/tables'; // Assure-toi que Table est exporté
import api from '@/src/lib/axios';
import { toast } from 'sonner';
import { AddTableModal } from '../../pos/tables/AddTableModal';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditTableModal } from '../../pos/tables/EditTableModal';

const statusMap = {
    free: { label: "Disponible", class: "bg-emerald-500/10 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
    occupied: { label: "En cours", class: "bg-orange-500/10 text-orange-600 border-orange-200", dot: "bg-orange-500" },
    billing: { label: "Addition", class: "bg-red-500/10 text-red-600 border-red-200 animate-pulse", dot: "bg-red-500" },
    reserved: { label: "Réservé", class: "bg-blue-500/10 text-blue-600 border-blue-200", dot: "bg-blue-500" },
};

export default function RestaurantAdminTables() {
    const router = useRouter();
    const [zones, setZones] = useState<Floor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [activeTable, setActiveTable] = useState<Table | null>(null);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const fetchZones = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/pos/floors');
            // On suppose que Laravel retourne { data: [...] } via API Resources
            setZones(res.data.data || res.data);
        } catch (error) {
            toast.error("Erreur lors du chargement du plan de salle");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);
    const handleEditClick = (table: Table) => {
        setEditingTable(table);
        setIsEditModalOpen(true);
    };
    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/api/pos/tables/${id}`);
            toast.success("Table supprimée");
            fetchZones(); // Rafraîchir les données
        } catch (error) {
            toast.error("Impossible de supprimer la table");
        }
    };
    return (
        <div className="flex flex-col gap-10 p-8 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            {/* Header Section */}
            <header className="flex flex-col gap-8">

                {/* Back Button - Look Premium & Minimal */}
                <div className="flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-3 text-stone-400 hover:text-stone-900 transition-all duration-300 ease-in-out"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition-all duration-300 group-hover:border-stone-900 group-hover:bg-stone-900 group-hover:text-white group-active:scale-90">
                            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 group-hover:opacity-100 transition-opacity">
                                Retour
                            </span>
                            <span className="text-sm font-medium hidden sm:block">Tableau de bord</span>
                        </div>
                    </button>
                </div>

                {/* Main Title & Action Buttons */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-serif font-bold text-stone-900 tracking-tight leading-none">
                            Plan de Salle
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.15em]">
                                Service en cours • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Nouveau Bouton : Gérer les Zones */}
                        <Button
                            variant="outline"
                            onClick={() => router.push('/admin/floors')}
                            className="h-12 px-5 rounded-2xl border-stone-200 bg-white text-stone-600 shadow-sm transition-all hover:bg-stone-900 hover:text-white hover:border-stone-900 active:scale-95 flex items-center gap-2 group"
                        >
                            <Layers className="h-4 w-4 text-orange-500 transition-colors group-hover:text-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Zones</span>
                        </Button>

                        {/* Bouton Refresh */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchZones}
                            disabled={loading}
                            className="h-12 w-12 rounded-2xl border-stone-200 bg-white text-stone-600 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-300 active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>

                        {/* Modal pour ajouter une table */}
                        <div className="flex-1 md:flex-none">
                            <AddTableModal
                                floors={zones}
                                onSuccess={fetchZones}
                                activeFloorId={''}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {loading ? (
                <LoadingSkeleton />
            ) : zones.length > 0 ? (
                <Tabs defaultValue={zones[0].id.toString()} className="space-y-10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-stone-200/60 pb-px">
                        <TabsList className="bg-transparent h-auto p-0 flex gap-10">
                            {zones.map((floor) => (
                                <TabsTrigger
                                    key={floor.id}
                                    value={floor.id.toString()}
                                    className="group relative rounded-none bg-transparent px-0 pb-4 text-sm font-bold uppercase tracking-[0.2em] text-stone-400 transition-all 
                       data-[state=active]:text-stone-900 data-[state=active]:shadow-none shadow-none border-none"
                                >
                                    {floor.name}
                                    {/* Barre de soulignement animée */}
                                    <span className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-stone-900 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* Légende stylisée avec effet de verre */}
                        <div className="hidden lg:flex items-center gap-8 bg-stone-50/50 backdrop-blur-sm px-5 py-2.5 rounded-full border border-stone-200/50 shadow-sm">
                            <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-stone-500">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span>
                                </span>
                                Libre
                            </div>
                            <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-stone-500">
                                <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                                En service
                            </div>
                            <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-stone-500">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]"></span>
                                </span>
                                Addition
                            </div>
                        </div>
                    </div>

                    {zones.map((floor) => (
                        <TabsContent
                            key={floor.id}
                            value={floor.id.toString()}
                            className="mt-0 focus-visible:outline-none ring-0 outline-none transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {floor.tables.map((table) => (
                                    <TableCard key={table.id} table={table} onEdit={handleEditClick} />
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-stone-200 rounded-[2rem] bg-stone-50/30">
                    <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                        <Plus className="text-stone-400" />
                    </div>
                    <p className="text-stone-500 font-medium italic">Aucun étage configuré pour le moment.</p>
                </div>
            )}
            {editingTable && (
                <EditTableModal
                    table={editingTable}
                    floors={zones}
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onSuccess={fetchZones}
                />
            )}
        </div>
    );
}

function TableCard({ table, onEdit }: { table: Table, onEdit: (table: Table) => void }) {
    const status = statusMap[table.status] || statusMap.free;

    return (
        <Card className="group relative overflow-hidden border-stone-200 transition-all duration-300 hover:border-stone-400 hover:shadow-xl cursor-pointer">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-5">
                    <div className="h-12 w-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Utensils className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className={`${status.class} border shadow-sm font-semibold px-2.5 py-0.5 transition-colors`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-2 ${status.dot}`} />
                        {status.label}
                    </Badge>
                </div>

                <div className="space-y-1 mb-6">
                    <h3 className="text-2xl font-bold tracking-tight text-stone-800 uppercase font-serif">{table.name}</h3>
                    <div className="flex items-center text-stone-500 text-sm font-medium">
                        <Users className="h-4 w-4 mr-2 text-stone-400" />
                        <span>{table.seats} Couverts</span>
                    </div>
                </div>

                <Separator className="my-4 opacity-60" />

                <div className="flex justify-between items-center h-10">
                    {table.status !== 'free' ? (
                        <>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Total</span>
                                <span className="text-xl font-bold text-stone-900 italic">
                                    {table.total ? `${table.total.toFixed(2)}€` : '0.00€'}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Service</span>
                                <div className="flex items-center text-sm font-bold text-stone-700">
                                    <Clock className="h-3.5 w-3.5 mr-1 text-orange-400" /> {table.time || '--'}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full text-center">
                            <span className="text-xs font-bold uppercase tracking-tighter text-stone-300 group-hover:text-stone-500 transition-colors">Prête pour accueil</span>
                        </div>
                    )}
                </div>

                {/* Bouton d'action rapide */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-stone-200 hover:bg-stone-900 hover:text-white transition-colors"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-stone-200 shadow-xl">
                            <DropdownMenuItem
                                onClick={() => onEdit(table)}
                                className="flex items-center gap-2 py-2.5 cursor-pointer rounded-lg focus:bg-stone-100"
                            >
                                <Pencil className="h-4 w-4 text-stone-500" />
                                <span className="font-medium">Modifier la table</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1 bg-stone-100" />

                            <DropdownMenuItem
                                onClick={() => {
                                    if (confirm('Supprimer cette table ?')) {
                                        // Ta logique de suppression vers Laravel ici
                                        console.log('Supprimer', table.id);
                                    }
                                }}
                                className="flex items-center gap-2 py-2.5 cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="font-medium">Supprimer</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>

        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex gap-6 border-b pb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-stone-200">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                            <Separator />
                            <div className="flex justify-between">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}