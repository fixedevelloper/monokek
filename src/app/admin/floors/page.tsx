'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Plus, RefreshCcw, Layers, 
    MoreVertical, Pencil, Trash2, Utensils 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import api from '@/src/lib/axios';
import { Floor } from '@/src/types/tables';
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AddFloorModal } from './AddFloorModal';
import { EditFloorModal } from './EditFloorModal';

export default function AdminFloorsPage() {
    const router = useRouter();
    const [floors, setFloors] = useState<Floor[]>([]);
    const [loading, setLoading] = useState(true);
const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleEditClick = (floor: Floor) => {
        setEditingFloor(floor);
        setIsEditModalOpen(true);
    };
    const fetchFloors = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/pos/floors');
            setFloors(res.data.data || res.data);
        } catch (error) {
            toast.error("Erreur lors du chargement des zones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFloors(); }, []);

    return (
        <div className="flex flex-col gap-10 p-8 max-w-5xl mx-auto min-h-screen text-stone-900">
            {/* Header */}
            <header className="flex flex-col gap-8">
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="group w-fit flex items-center gap-3 p-0 hover:bg-transparent"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white transition-all group-hover:bg-stone-900 group-hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Retour</span>
                </Button>

                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-serif font-bold tracking-tight italic">Zones & Étages</h1>
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} className="text-orange-500" />
                            Configuration des espaces de restauration
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="icon" onClick={fetchFloors} className="h-12 w-12 rounded-2xl">
                            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <AddFloorModal onSuccess={fetchFloors} />
                    </div>
                </div>
            </header>

            {/* List of Floors */}
            <div className="grid gap-4">
                {loading ? (
                    <Skeleton className="h-24 w-full rounded-3xl" />
                ) : floors.map((floor) => (
                    <FloorItem
                    onEdit={() => handleEditClick(floor)}
                     key={floor.id} floor={floor} onRefresh={fetchFloors} />
                ))}
            </div>
            <EditFloorModal 
                floor={editingFloor}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={fetchFloors}
            />
        </div>
    );
}

function FloorItem({ floor, onEdit, onRefresh }: { floor: Floor, onEdit: () => void, onRefresh: () => void }) {
    return (
        <Card className="group border-stone-200 hover:border-stone-400 transition-all rounded-[2rem] overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold uppercase font-serif tracking-tight">{floor.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-tighter flex items-center gap-1">
                                <Utensils size={12} /> {floor.tables?.length || 0} Tables configurées
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="hidden sm:flex text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900">
                        Voir le plan
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-transparent hover:border-stone-200">
                                <MoreVertical size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 border-stone-200 shadow-xl">
                            <DropdownMenuItem
                            onClick={onEdit}
                             className="gap-2 py-3 cursor-pointer rounded-lg">
                                <Pencil size={14} className="text-stone-500" />
                                <span className="font-bold text-xs uppercase tracking-wider">Renommer</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="gap-2 py-3 cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600"
                            >
                                <Trash2 size={14} />
                                <span className="font-bold text-xs uppercase tracking-wider">Supprimer la zone</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}