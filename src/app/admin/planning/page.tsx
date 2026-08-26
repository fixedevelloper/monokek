"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, addWeeks, format, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Clock, Edit2, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as staffingApi from "@/src/lib/api/staffing";
import * as identityApi from "@/src/lib/api/identity";
import * as companyApi from "@/src/lib/api/company";
import { ShiftDto } from "@/src/lib/api/types/staffing";
import { getErrorMessage } from "@/src/lib/errors";
import { ShiftModal, ShiftFormValues } from "./ShiftModal";

export default function AdminPlanningPage() {
    const queryClient = useQueryClient();
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [modalOpen, setModalOpen] = useState(false);
    const [shiftToEdit, setShiftToEdit] = useState<ShiftDto | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

    // Plage exacte de la semaine (Lundi 00:00:00 -> Dimanche 23:59:59)
    const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const fromIso = useMemo(() => format(weekStart, "yyyy-MM-dd'T'00:00:00"), [weekStart]);
    const toIso = useMemo(() => format(weekEnd, "yyyy-MM-dd'T'23:59:59"), [weekEnd]);

    // Server state queries
    const { data: branches = [] } = useQuery({
        queryKey: ["branches-for-planning"],
        queryFn: () => companyApi.listBranches(),
    });

    const { data: staff = [] } = useQuery({
        queryKey: ["staff-for-planning"],
        queryFn: () => identityApi.listStaff(),
    });

    const { data: shifts = [], isLoading } = useQuery({
        queryKey: ["shifts", fromIso, toIso],
        queryFn: () => staffingApi.listShifts(undefined, fromIso, toIso),
    });

    const invalidateShifts = () => queryClient.invalidateQueries({ queryKey: ["shifts"] });

    // Mutations
    const createMutation = useMutation({
        mutationFn: staffingApi.createShift,
        onSuccess: () => {
            toast.success("Shift créé avec succès");
            invalidateShifts();
            handleCloseModal();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Erreur lors de la création")),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof staffingApi.updateShift>[1] }) =>
            staffingApi.updateShift(id, payload),
        onSuccess: () => {
            toast.success("Shift mis à jour");
            invalidateShifts();
            handleCloseModal();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Erreur lors de la modification")),
    });

    const deleteMutation = useMutation({
        mutationFn: staffingApi.deleteShift,
        onSuccess: () => {
            toast.success("Shift supprimé");
            invalidateShifts();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Impossible de supprimer ce shift")),
    });

    // Handlers
    const handleOpenCreateModal = (dateStr?: string) => {
        setShiftToEdit(null);
        setSelectedDate(dateStr ?? format(new Date(), "yyyy-MM-dd"));
        setModalOpen(true);
    };

    const handleOpenEditModal = (shift: ShiftDto) => {
        setShiftToEdit(shift);
        setSelectedDate(shift.startsAt.slice(0, 10));
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setShiftToEdit(null);
    };

    const handleSubmit = (data: ShiftFormValues) => {
        const defaultBranchId = branches[0]?.id;
        if (!defaultBranchId) {
            toast.error("Aucune succursale disponible pour attribuer ce shift.");
            return;
        }

        const payload = {
            userId: Number(data.userId),
            branchId: defaultBranchId,
            startsAt: `${data.date}T${data.startTime}:00`,
            endsAt: `${data.date}T${data.endTime}:00`,
            note: data.note?.trim() || undefined,
        };

        if (shiftToEdit) {
            updateMutation.mutate({ id: shiftToEdit.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (shift: ShiftDto) => {
        if (!confirm(`Voulez-vous vraiment supprimer le shift de ${shift.userName ?? "cet employé"} ?`)) return;
        deleteMutation.mutate(shift.id);
    };

    const shiftsForDay = useCallback(
        (day: Date) => {
            const dateStr = format(day, "yyyy-MM-dd");
            return shifts
                .filter((s) => s.startsAt.startsWith(dateStr))
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        },
        [shifts]
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-20">
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-100" asChild>
                            <Link href="/admin">
                                <ArrowLeft size={20} />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                                Planning <span className="text-primary">Personnel</span>
                            </h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                {shifts.length} {shifts.length > 1 ? "shifts planifiés" : "shift planifié"} cette semaine
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 border rounded-2xl p-1 bg-white dark:bg-slate-900 shadow-sm">
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setWeekStart(addWeeks(weekStart, -1))}>
                                <ChevronLeft size={16} />
                            </Button>
                            <span className="text-xs font-black uppercase tracking-widest px-3 min-w-[170px] text-center">
                {format(weekStart, "d MMM", { locale: fr })} — {format(weekEnd, "d MMM yyyy", { locale: fr })}
              </span>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
                                <ChevronRight size={16} />
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            className="rounded-2xl font-bold uppercase text-[10px] h-10 px-4"
                            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                        >
                            Aujourd'hui
                        </Button>

                        <Button asChild variant="secondary" className="rounded-2xl font-bold uppercase text-[10px] h-10 gap-2">
                            <Link href="/pos/clock">
                                <Clock size={14} /> Écran de pointage
                            </Link>
                        </Button>

                        <Button
                            className="h-10 px-5 rounded-2xl font-black uppercase tracking-wider text-[11px] gap-2 shadow-xl shadow-primary/20"
                            onClick={() => handleOpenCreateModal()}
                        >
                            <Plus size={16} /> Nouveau shift
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 animate-pulse">
                        {days.map((d) => (
                            <div key={d.toISOString()} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        {days.map((day) => {
                            const dayShifts = shiftsForDay(day);
                            const dateStr = format(day, "yyyy-MM-dd");

                            return (
                                <div key={day.toISOString()} className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                                {format(day, "EEEE", { locale: fr })}
                                            </p>
                                            <p className="text-lg font-black">{format(day, "d MMM", { locale: fr })}</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="w-7 h-7 rounded-full bg-slate-200/60 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                                            onClick={() => handleOpenCreateModal(dateStr)}
                                            title="Ajouter un shift ce jour"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {dayShifts.map((shift) => (
                                            <Card key={shift.id} className="p-3 rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 group relative">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-black text-sm truncate">{shift.userName ?? `#${shift.userId}`}</p>
                                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none text-[9px] font-black mt-1">
                                                            {shift.startsAt.slice(11, 16)} – {shift.endsAt.slice(11, 16)}
                                                        </Badge>
                                                        {shift.note && (
                                                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2" title={shift.note}>
                                                                {shift.note}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditModal(shift)}
                                                            className="text-slate-400 hover:text-primary p-1"
                                                            title="Modifier"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(shift)}
                                                            className="text-slate-400 hover:text-red-600 p-1"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                        {dayShifts.length === 0 && (
                                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-6 text-center">
                                                <p className="text-[10px] font-semibold text-muted-foreground">Aucun shift</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <ShiftModal
                open={modalOpen}
                onOpenChange={(open) => {
                    if (!open) handleCloseModal();
                    else setModalOpen(true);
                }}
                onSubmit={handleSubmit}
                staff={staff}
                initialData={shiftToEdit}
                defaultDate={selectedDate}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}