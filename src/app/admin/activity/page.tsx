"use client";

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AlertTriangle, ArrowLeft, Loader2, ListChecks, Search, User} from 'lucide-react';
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {useRouter} from "next/navigation";
import {useInfiniteQuery} from '@tanstack/react-query';
import {format, subDays} from 'date-fns';
import {DateRange} from 'react-day-picker';
import {DateRangePicker} from '@/components/ui/date-range-picker';
import * as activityLogApi from '@/src/lib/api/activityLog';
import {ActivityLogDto} from '@/src/lib/api/activityLog';
import {toast} from 'sonner';

// Ces deux catégories sont la raison d'être de cette page : suppression de round et
// annulation de commande passent toujours par une validation PIN manager
// (OrderService#voidRound / #cancelOrder) — on les distingue visuellement du reste
// du journal (connexions, ouvertures de caisse, etc.) plutôt que d'ajouter une colonne
// "type" côté backend pour un simple filtre.
function isSensitive(action: string) {
    return action.includes('supprimé') || action.includes('-> cancelled') || action.includes('annulée');
}

export default function ActivityLogPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");

    // Plage par défaut : 30 derniers jours, même défaut que l'historique des ventes admin.
    const [appliedRange, setAppliedRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const startDate = appliedRange.from ? format(appliedRange.from, 'yyyy-MM-dd') : undefined;
    const endDate = appliedRange.to
        ? format(appliedRange.to, 'yyyy-MM-dd')
        : appliedRange.from
            ? format(appliedRange.from, 'yyyy-MM-dd')
            : undefined;

    const {data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['activity-logs', startDate, endDate],
        queryFn: ({pageParam}) => activityLogApi.listActivityLogs({startDate, endDate, page: pageParam}),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    });

    useEffect(() => {
        if (isError) toast.error("Impossible de charger le journal d'activité");
    }, [isError]);

    const logs = useMemo(() => data?.pages.flatMap((p) => p.content) ?? [], [data]);

    // Filtre texte côté client, appliqué sur les pages déjà chargées — la recherche ne porte
    // donc que sur ce qui a déjà défilé, pas sur tout le journal (pas de recherche serveur ici).
    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        (log.userName ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const handleDateChange = (newRange?: DateRange) => {
        if (!newRange) return;
        setAppliedRange(newRange);
    };

    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            {rootMargin: "300px"}
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="rounded-2xl border-2 border-slate-200 h-14 w-14 flex items-center justify-center p-0 bg-white"
                    >
                        <ArrowLeft size={28} />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
                            Journal <span className="text-primary">d'activité</span>
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Traçabilité complète : suppressions de round, annulations, accès, caisse.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Filtrer par action ou par utilisateur..."
                        className="pl-12 h-12 rounded-xl border-none bg-slate-50 font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <DateRangePicker initialRange={appliedRange} onApply={handleDateChange} />
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-primary h-12 w-12" />
                        <p className="font-black italic uppercase text-slate-400 animate-pulse">Chargement du journal...</p>
                    </div>
                ) : filteredLogs.length > 0 ? (
                    <>
                        {filteredLogs.map((log) => <ActivityLogRow key={log.id} log={log} />)}
                        <div ref={sentinelRef} className="h-4" />
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-6">
                                <Loader2 className="animate-spin text-primary h-6 w-6" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed">
                        <ListChecks className="mx-auto h-10 w-10 text-slate-200 mb-3" />
                        <p className="text-slate-400 font-bold italic">Aucune entrée trouvée.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ActivityLogRow({log}: { log: ActivityLogDto }) {
    const sensitive = isSensitive(log.action);
    return (
        <Card className={cn("rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all overflow-hidden", sensitive && "ring-2 ring-red-100")}>
            <CardContent className="p-0">
                <div className="flex items-center p-4 gap-6">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                        sensitive ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                    )}>
                        {sensitive ? <AlertTriangle size={20} /> : <User size={20} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 break-words">{log.action}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {log.userName ?? (log.userId ? `Utilisateur #${log.userId}` : 'Système')}
                        </p>
                    </div>

                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                            {log.createdAt ?? '—'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
