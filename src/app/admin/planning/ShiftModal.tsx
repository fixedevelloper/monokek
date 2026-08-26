"use client";

import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {CalendarClock, Loader2} from "lucide-react";
import {StaffMember} from "@/src/types/management";
import {ShiftDto} from "@/src/lib/api/types/staffing";

export interface ShiftFormValues {
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    note: string;
}

interface ShiftModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ShiftFormValues) => void;
    staff: StaffMember[];
    initialData?: ShiftDto | null;
    defaultDate?: string;
    isPending?: boolean;
}

function toDateInput(iso: string) {
    return iso.slice(0, 10);
}

function toTimeInput(iso: string) {
    return iso.slice(11, 16);
}

export function ShiftModal({ open, onOpenChange, onSubmit, staff, initialData, defaultDate, isPending }: ShiftModalProps) {
    const { register, handleSubmit, watch, setValue, reset } = useForm<ShiftFormValues>({
        defaultValues: { userId: "", date: defaultDate ?? "", startTime: "09:00", endTime: "17:00", note: "" },
    });

    useEffect(() => {
        if (!open) return;
        if (initialData) {
            reset({
                userId: String(initialData.userId),
                date: toDateInput(initialData.startsAt),
                startTime: toTimeInput(initialData.startsAt),
                endTime: toTimeInput(initialData.endsAt),
                note: initialData.note ?? "",
            });
        } else {
            reset({ userId: "", date: defaultDate ?? "", startTime: "09:00", endTime: "17:00", note: "" });
        }
    }, [open, initialData, defaultDate, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2 tracking-tighter">
                        <CalendarClock className="text-primary" /> {initialData ? "Modifier" : "Nouveau"} <span className="text-primary">Shift</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Employé</Label>
                        <Select onValueChange={(v) => setValue("userId", v)} value={watch("userId")}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                                <SelectValue placeholder="Choisir un employé" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl font-bold">
                                {staff.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Date</Label>
                        <Input type="date" {...register("date", { required: true })} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Début</Label>
                            <Input type="time" {...register("startTime", { required: true })} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Fin</Label>
                            <Input type="time" {...register("endTime", { required: true })} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase ml-1 text-slate-500">Note (optionnel)</Label>
                        <Input {...register("note")} placeholder="Ex: Ouverture, remplacement..." className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
                        >
                            {isPending ? <Loader2 className="animate-spin" /> : (initialData ? "Sauvegarder" : "Créer le shift")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
