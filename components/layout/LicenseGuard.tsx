"use client";

import { useLicense } from "@/src/hooks/useLicense";
import React, { useEffect, useState } from "react";
import {Loader2, ShieldAlert, Lock, Key, AlertTriangle, Settings, WifiOff} from "lucide-react";
import { toast } from "sonner";
import {Button} from "../ui/button";
import {Input} from "../ui/input";
import api from "../../src/lib/axios";
import {useLicenseWatcher} from "../../src/hooks/useLicenseWatcher";
import {IPConfigModal} from "./IPConfigModal";
import {AxiosError} from "axios";
import {getErrorMessage} from "@/src/lib/errors";

const NETWORK_ERROR_RETRY_MS = 8000;

export function LicenseGuard({ children }: { children: React.ReactNode }) {
    const { data: status, isLoading, refetch, error } = useLicense();
    const [activationKey, setActivationKey] = useState("");
    const [isActivating, setIsActivating] = useState(false);
    const isFraud = error instanceof AxiosError && error.response?.status === 403;
    // Pas de réponse du tout (serveur injoignable, DNS, timeout) — distinct d'une
    // vraie réponse HTTP disant que la licence est invalide/expirée/frauduleuse.
    const isNetworkError = error instanceof AxiosError && !error.response;
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Auto-retry tant qu'on est bloqué sur une erreur réseau — sans ça, seul le
    // refetchInterval de 30 min (ou un clic manuel) relancerait la vérification,
    // ce qui laisserait le personnel déjà licencié bloqué pour rien après une
    // simple coupure Wi-Fi de quelques secondes.
    useEffect(() => {
        if (!isNetworkError) return;
        const timer = setTimeout(() => refetch(), NETWORK_ERROR_RETRY_MS);
        return () => clearTimeout(timer);
    }, [isNetworkError, refetch]);

    const handleActivate = async () => {
        if (!activationKey) return;
        setIsActivating(true);

        try {
            const res = await api.post("/api/license/activate", { key: activationKey });

            // Si le serveur local renvoie 200 mais avec expired: true
            if (res.data.expired) {
                toast.error(`Licence expirée depuis le ${res.data.expiry_date}`);
                setIsActivating(false);
            } else {
                toast.success("Système activé !");
            }
            refetch(); // Pour débloquer le Guard
        } catch (err) {
            // Si 404 ou 401 (Clé invalide)
            setIsActivating(false);
            toast.error(getErrorMessage(err, "Erreur d'activation"));
        }
    };
    useLicenseWatcher();
    // 1. Chargement
    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Vérification...</p>
            </div>
        );
    }

    // 1.5 Serveur injoignable — PAS un problème de licence, ne pas demander de
    // ressaisir une clé. Réessai automatique (voir l'effet ci-dessus) + bouton manuel.
    if (isNetworkError) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-6 gap-4">
                <div className="bg-amber-500/10 w-16 h-16 rounded-full flex items-center justify-center">
                    <WifiOff className="text-amber-400 h-8 w-8" />
                </div>
                <div className="text-center space-y-1.5">
                    <h2 className="text-xl font-black uppercase italic text-white">Serveur injoignable</h2>
                    <p className="text-xs text-slate-400 max-w-xs">
                        Nouvelle tentative automatique dans quelques secondes. Vérifiez la connexion réseau du poste.
                    </p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => refetch()} className="rounded-xl">
                        Réessayer maintenant
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsConfigOpen(true)} className="rounded-xl">
                        <Settings className="h-3.5 w-3.5 mr-1.5" /> Configuration réseau
                    </Button>
                </div>
                <IPConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
            </div>
        );
    }

    // 2. Blocage (Expiration OU Fraude OU Non-activé) — on a une vraie réponse du
    // serveur ici, jamais à cause d'une simple coupure réseau (voir isNetworkError ci-dessus).
    if (!status?.active || status?.expired || isFraud) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-950 p-6">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">

                    {/* Header spécifique selon l'erreur */}
                    <div className="text-center mb-8">
                        {isFraud ? (
                            <>
                                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldAlert className="text-red-600 h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-black uppercase italic text-red-600 leading-tight">Sécurité Violée</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                    Modification non autorisée détectée
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="text-indigo-600 h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-black uppercase italic leading-tight">
                                    {status?.expired ? "Licence Expirée" : "Activation Requise"}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                    {status?.expired ? `Fin de validité : ${status.expiry_date}` : "Veuillez activer votre produit"}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Formulaire de secours */}
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                            <p className="text-[9px] font-bold text-slate-500 uppercase text-center leading-relaxed">
                                Entrez une clé de licence officielle pour restaurer l'accès au système.
                            </p>
                        </div>

                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="RESTO-PRO-XXXX-..."
                                className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-mono font-bold text-center tracking-widest"
                                value={activationKey}
                                onChange={(e) => setActivationKey(e.target.value)}
                            />
                        </div>

                        <Button
                            disabled={isActivating || !activationKey}
                            onClick={handleActivate}
                            className={`w-full h-14 rounded-2xl font-black uppercase italic shadow-lg transition-all ${
                                isFraud
                                    ? "bg-red-600 hover:bg-red-700 shadow-red-100"
                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                            }`}
                        >
                            {isActivating ? <Loader2 className="animate-spin" /> : "Restaurer le système"}
                        </Button>
                    </div>

                    <p className="text-center text-[9px] text-slate-400 mt-8 font-bold uppercase tracking-tighter">
                        Identifiant technique : <span className="font-mono">{isFraud ? 'ERR_INTEGRITY_FAIL' : 'ERR_LICENSE_REQ'}</span>
                    </p>
                </div>
                <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2 group">
                    <p className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter backdrop-blur-md">
                        Réglages Système
                    </p>
                    <Button
                        type="button"
                        onClick={() => setIsConfigOpen(true)}
                        className="h-14 w-14 rounded-full bg-white text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-slate-900 hover:text-white border-none transition-all duration-300"
                    >
                        <Settings className="h-6 w-6" />
                    </Button>
                </div>
                <IPConfigModal
                    isOpen={isConfigOpen}
                    onClose={() => setIsConfigOpen(false)}
                />
            </div>
        );
    }
    return <>{children}</>;
}