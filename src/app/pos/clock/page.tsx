"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Delete, LogIn, LogOut, UserCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as identityApi from "@/src/lib/api/identity";
import * as staffingApi from "@/src/lib/api/staffing";
import { TimeClockEntryDto } from "@/src/lib/api/types/staffing";
import { resolveBranchId } from "@/src/lib/branch";
import { getErrorMessage } from "@/src/lib/errors";
import {router} from "next/client";
import {useRouter} from "next/navigation";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function ClockPage() {
    const [pin, setPin] = useState("");
    const [busy, setBusy] = useState(false);
    const [present, setPresent] = useState<TimeClockEntryDto[]>([]);
    const [branchId, setBranchId] = useState<string | number | null>(null);
    const [lastAction, setLastAction] = useState<{ name: string; kind: "in" | "out" } | null>(null);
    const router = useRouter();
    // Guard pour éviter les double-soumissions en parallèle
    const isSubmittingRef = useRef(false);

    const refreshPresent = useCallback(async (bId: string | number) => {
        try {
            const data = await staffingApi.currentlyPresent(bId);
            setPresent(data);
        } catch (error) {
            console.error("[ClockPage] Impossible de charger la liste des présents :", error);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            const bId = await resolveBranchId();
            if (isMounted) {
                setBranchId(bId);
                if (bId) refreshPresent(bId);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [refreshPresent]);

    const submit = useCallback(async (candidate: string) => {
        if (!branchId) {
            toast.error("Succursale introuvable — vérifiez la configuration du poste.");
            setPin("");
            return;
        }

        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setBusy(true);

        try {
            const user = await identityApi.lookupPin(branchId, candidate);
            const alreadyPresent = present.some((entry) => entry.userId === user.id);

            if (alreadyPresent) {
                await staffingApi.clockOut(user.id, candidate);
                toast.success(`${user.name} : sortie enregistrée`);
                setLastAction({ name: user.name, kind: "out" });
            } else {
                await staffingApi.clockIn(user.id, branchId, candidate);
                toast.success(`${user.name} : entrée enregistrée`);
                setLastAction({ name: user.name, kind: "in" });
            }
            await refreshPresent(branchId);
        } catch (error) {
            toast.error(getErrorMessage(error, "Code PIN invalide"));
        } finally {
            setPin("");
            setBusy(false);
            isSubmittingRef.current = false;
        }
    }, [branchId, present, refreshPresent]);

    const pressDigit = useCallback((digit: string) => {
        if (busy || isSubmittingRef.current) return;

        setPin((prevPin) => {
            if (prevPin.length >= 4) return prevPin;
            const nextPin = prevPin + digit;
            if (nextPin.length === 4) {
                // Déclencher la validation au 4e chiffre
                submit(nextPin);
            }
            return nextPin;
        });
    }, [busy, submit]);

    const handleDeleteDigit = useCallback(() => {
        if (busy || isSubmittingRef.current) return;
        setPin((prev) => prev.slice(0, -1));
    }, [busy]);

    // Support du pavé numérique physique / clavier
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (/^[0-9]$/.test(e.key)) {
                pressDigit(e.key);
            } else if (e.key === "Backspace") {
                handleDeleteDigit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [pressDigit, handleDeleteDigit]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center p-6">
            <header className="w-full max-w-5xl flex items-center gap-4 mb-8">
                <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white shadow-sm hover:bg-slate-100"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter">Pointage</h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Entrez votre code PIN à 4 chiffres
                    </p>
                </div>
            </header>

            <div className="flex-1 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                {/* Section Pavé Numérique */}
                <div className="flex flex-col items-center gap-8">
                    <div className="flex gap-4 relative">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                                    i < pin.length
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-slate-200 text-slate-300 dark:border-slate-800"
                                }`}
                            >
                                {i < pin.length ? "•" : ""}
                            </div>
                        ))}
                        {busy && (
                            <div className="absolute -right-10 top-1/2 -translate-y-1/2">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                        {DIGITS.map((d) => (
                            <Button
                                key={d}
                                variant="outline"
                                disabled={busy}
                                className="h-16 rounded-2xl text-xl font-black bg-white dark:bg-slate-900"
                                onClick={() => pressDigit(d)}
                            >
                                {d}
                            </Button>
                        ))}
                        <div />
                        <Button
                            variant="outline"
                            disabled={busy}
                            className="h-16 rounded-2xl text-xl font-black bg-white dark:bg-slate-900"
                            onClick={() => pressDigit("0")}
                        >
                            0
                        </Button>
                        <Button
                            variant="outline"
                            disabled={busy || pin.length === 0}
                            className="h-16 rounded-2xl bg-white dark:bg-slate-900"
                            onClick={handleDeleteDigit}
                        >
                            <Delete size={20} />
                        </Button>
                    </div>

                    {lastAction && (
                        <div
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase shadow-sm ${
                                lastAction.kind === "in"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                            }`}
                        >
                            {lastAction.kind === "in" ? <LogIn size={16} /> : <LogOut size={16} />}
                            <span>
                {lastAction.name} {lastAction.kind === "in" ? "a pointé son entrée" : "a pointé sa sortie"}
              </span>
                        </div>
                    )}
                </div>

                {/* Section Liste des Présents */}
                <div className="w-full">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 text-center md:text-left">
                        {present.length} employé{present.length > 1 ? "s" : ""} présent{present.length > 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                        {present.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-800"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <UserCircle2 size={22} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{entry.userName ?? `#${entry.userId}`}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        depuis {entry.clockInAt.slice(11, 16)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {present.length === 0 && (
                            <div className="col-span-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-12 text-center">
                                <p className="text-xs font-semibold text-muted-foreground">Aucun employé n'est actuellement pointé</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}