'use client'

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {AlertCircle, ArrowLeft, CheckCircle2, Globe, Loader2, Lock, Settings} from 'lucide-react';
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {invalidateBackendIpCache, withScheme} from "@/src/lib/axios";
import {hasSetupPin, setSetupPin, verifySetupPin} from "@/src/lib/setupPin";

// 'checking' : on détermine encore si ce poste est déjà provisionné et protégé.
// 'locked' : poste déjà configuré + PIN admin défini — il faut le saisir avant de voir le formulaire.
// 'form' : formulaire IP visible (premier provisionnement, ou PIN vérifié).
// 'set-pin' : juste après un premier provisionnement réussi, si aucun PIN n'existait encore — on force sa création
//             avant de quitter la page, sinon la porte resterait grande ouverte indéfiniment.
type Step = 'checking' | 'locked' | 'form' | 'set-pin';

export default function SetupPage() {
    const router = useRouter();
    const [ip, setIp] = useState('');
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const [step, setStep] = useState<Step>('checking');
    const [gatePin, setGatePin] = useState('');
    const [gateError, setGateError] = useState(false);
    const [gateVerifying, setGateVerifying] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [newPinConfirm, setNewPinConfirm] = useState('');
    const [alreadyProvisioned, setAlreadyProvisioned] = useState(false);

    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

    // 1. Chargement initial : IP déjà connue + poste déjà protégé par un PIN admin ?
    useEffect(() => {
        const loadConfig = async () => {
            let savedIp: string | undefined;
            try {
                if (isTauri) {
                    const { load } = await import("@tauri-apps/plugin-store");
                    const store = await load(".settings.json", { autoSave: true, defaults: {} });
                    savedIp = await store.get<string>("backend-ip") ?? undefined;
                } else {
                    savedIp = localStorage.getItem("backend-ip") ?? undefined;
                }
                if (savedIp) setIp(savedIp);
            } catch (e) {
                console.error("Erreur chargement config:", e);
            }

            setAlreadyProvisioned(!!savedIp);
            const pinAlreadySet = await hasSetupPin();
            if (savedIp && pinAlreadySet) {
                setStep('locked');
            } else {
                setStep('form');
            }
        };
        loadConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

const handleSave = async () => {
    setTesting(true);
    setStatus('idle');

    const cleanIp = withScheme(ip);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {

        // 1. Test de connexion (Identique pour les deux)
        const response = await fetch(`${cleanIp}/api/ping`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error("Serveur injoignable");
        const data = await response.json();

        if (data.status === 'ok') {
            // Schéma conservé : il décide de https (défaut) ou http (développement) à chaque appel.
            const ipToStore = cleanIp;

            // 2. Stockage intelligent selon l'instance
            if (isTauri) {
                // --- MODE DESKTOP (TAURI) ---
                const { load } = await import("@tauri-apps/plugin-store");
             const store = await load(".settings.json", {
                                 autoSave: true,
                                 defaults: {}
                             });

                await store.set("backend-ip", ipToStore);
                await store.save();
                console.log("Config sauvegardée dans le Store Tauri");
            } else {
                // --- MODE WEB (NEXTJS / BROWSER) ---
                localStorage.setItem("backend-ip", ipToStore);
                console.log("Config sauvegardée dans le LocalStorage");
            }
            invalidateBackendIpCache();

            setStatus('success');
            toast.success("Terminal connecté au serveur");

            // Premier provisionnement sans PIN admin encore défini : on force sa
            // création maintenant plutôt que de laisser ce réglage ouvert à vie.
            if (!(await hasSetupPin())) {
                setStep('set-pin');
            } else {
                setTimeout(() => router.push('/'), 1200);
            }

        } else {
            throw new Error("Réponse invalide du serveur");
        }
    } catch (error) {
        setStatus('error');
        toast.error("Connexion échouée : vérifiez l'IP et le réseau");
    } finally {
        clearTimeout(timeoutId);
        setTesting(false);
    }
};

    const handleUnlock = async () => {
        setGateVerifying(true);
        setGateError(false);
        try {
            const ok = await verifySetupPin(gatePin);
            if (ok) {
                setStep('form');
            } else {
                setGateError(true);
                setGatePin('');
            }
        } finally {
            setGateVerifying(false);
        }
    };

    const handleSetPin = async () => {
        if (newPin.length !== 4) {
            toast.error("Le code PIN doit comporter 4 chiffres");
            return;
        }
        if (newPin !== newPinConfirm) {
            toast.error("Les deux codes PIN ne correspondent pas");
            return;
        }
        await setSetupPin(newPin);
        toast.success("PIN administrateur défini");
        router.push('/');
    };

    if (step === 'checking') {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-stone-400" />
            </div>
        );
    }

    if (step === 'locked') {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                    <CardContent className="p-10">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-16 w-16 rounded-3xl bg-stone-900 flex items-center justify-center text-white shadow-lg shadow-stone-200">
                                <Lock />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-serif font-bold text-stone-900 italic">Poste protégé</h1>
                                <p className="text-sm text-stone-500 font-medium tracking-wide">
                                    Ce terminal est déjà configuré. Entrez le PIN administrateur pour modifier le serveur.
                                </p>
                            </div>

                            <div className="w-full space-y-4 mt-4">
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    autoFocus
                                    value={gatePin}
                                    onChange={(e) => { setGatePin(e.target.value.replace(/\D/g, "")); setGateError(false); }}
                                    onKeyDown={(e) => e.key === 'Enter' && gatePin.length === 4 && handleUnlock()}
                                    placeholder="••••"
                                    className="h-14 rounded-2xl bg-stone-50 border-none text-center text-3xl tracking-[0.5em] font-black focus-visible:ring-stone-900"
                                />

                                {gateError && (
                                    <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider justify-center">
                                        <AlertCircle size={14} /> Code PIN incorrect
                                    </div>
                                )}

                                <Button
                                    onClick={handleUnlock}
                                    disabled={gateVerifying || gatePin.length !== 4}
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-stone-900 hover:bg-stone-800"
                                >
                                    {gateVerifying ? <Loader2 className="animate-spin" /> : "Déverrouiller"}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => router.push('/login')}
                                    className="w-full h-11 rounded-2xl font-bold text-stone-400 gap-2"
                                >
                                    <ArrowLeft size={16} /> Retour à la connexion
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'set-pin') {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                    <CardContent className="p-10">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-16 w-16 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <Lock />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-serif font-bold text-stone-900 italic">Protéger ce poste</h1>
                                <p className="text-sm text-stone-500 font-medium tracking-wide">
                                    Définissez un code PIN administrateur : il sera demandé pour rechanger le serveur de ce terminal.
                                </p>
                            </div>

                            <div className="w-full space-y-3 mt-4">
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    autoFocus
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                                    placeholder="Nouveau PIN (4 chiffres)"
                                    className="h-14 rounded-2xl bg-stone-50 border-none text-center text-2xl tracking-[0.4em] font-black focus-visible:ring-stone-900"
                                />
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={newPinConfirm}
                                    onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ""))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSetPin()}
                                    placeholder="Confirmer le PIN"
                                    className="h-14 rounded-2xl bg-stone-50 border-none text-center text-2xl tracking-[0.4em] font-black focus-visible:ring-stone-900"
                                />

                                <Button
                                    onClick={handleSetPin}
                                    disabled={newPin.length !== 4 || newPinConfirm.length !== 4}
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Enregistrer et continuer
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
            <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                <CardContent className="p-10">
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-stone-900 flex items-center justify-center text-white shadow-lg shadow-stone-200">
                            <Settings className={testing ? "animate-spin" : ""} />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-serif font-bold text-stone-900 italic">Configuration</h1>
                            <p className="text-sm text-stone-500 font-medium tracking-wide">
                                Adresse IP du serveur central
                            </p>
                        </div>

                        <div className="w-full space-y-4 mt-4">
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                                <Input
                                    value={ip}
                                    onChange={(e) => setIp(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    placeholder="ex: 192.168.1.50"
                                    className="h-14 pl-12 rounded-2xl bg-stone-50 border-none font-mono font-bold text-lg text-stone-800 placeholder:text-stone-200 focus-visible:ring-stone-900"
                                />
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={testing || !ip}
                                className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${status === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-stone-900 hover:bg-stone-800'
                                    }`}
                            >
                                {testing ? <Loader2 className="animate-spin" /> :
                                    status === 'success' ? <CheckCircle2 /> : "Vérifier & Enregistrer"}
                            </Button>

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider justify-center animate-in fade-in zoom-in-95">
                                    <AlertCircle size={14} /> Impossible de joindre le backend
                                </div>
                            )}

                            {/* Poste déjà provisionné mais sans PIN admin (ex: mise à jour depuis une
                                version antérieure à cette protection) — permet de le protéger sans
                                avoir à retester/resauvegarder l'IP actuelle. */}
                            {alreadyProvisioned && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep('set-pin')}
                                    className="w-full h-11 rounded-2xl font-bold text-[10px] uppercase tracking-widest gap-2"
                                >
                                    <Lock size={14} /> Protéger ce poste avec un PIN admin
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <p className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">
                MONO-KEK POS • v2.0 • TAURI NATIVE
            </p>
        </div>
    );
}
