import React from 'react';
import { Printer, X, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ReportData {
    opening_amount: number;
    total_payments: number;
    expected_total: number;
    actual_total: number;
    difference: number;
    payments_detail: { name: string; total: number }[];
    note?: string;
}

export default function CashReportTicket({ data, onPrint, onClose }: { data: ReportData, onPrint: () => void, onClose: () => void }) {
    const isNegative = data.difference < 0;

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[380px] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header Ticket */}
                <div className="bg-stone-50 p-6 border-b border-dashed border-stone-200 text-center relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-stone-400 hover:text-stone-900">
                        <X size={20} />
                    </button>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Rapport de Fin de Shift</div>
                    <h2 className="text-2xl font-serif font-bold italic text-stone-900">Mono-Kek POS</h2>
                    <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-widest">Douala, Cameroun</p>
                </div>

                {/* Contenu Ticket */}
                <div className="p-8 space-y-6 font-mono">
                    
                    {/* Montants Principaux */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Fond de Caisse</span>
                            <span className="font-bold">{data.opening_amount.toLocaleString()} F</span>
                        </div>
                        
                        <div className="pt-2 border-t border-stone-100">
                            <div className="text-[10px] font-bold text-stone-400 uppercase mb-2">Détail des Ventes</div>
                            {data.payments_detail.map((p, i) => (
                                <div key={i} className="flex justify-between text-sm mb-1">
                                    <span>{p.name}</span>
                                    <span>{Number(p.total).toLocaleString()} F</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Résumé Calculé */}
                    <div className="bg-stone-50 rounded-2xl p-4 space-y-2 border border-stone-100">
                        <div className="flex justify-between text-xs text-stone-500">
                            <span>Total Théorique</span>
                            <span>{data.expected_total.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between text-lg font-black text-stone-900 border-t border-stone-200 pt-2">
                            <span>Total Réel</span>
                            <span>{data.actual_total.toLocaleString()} F</span>
                        </div>
                    </div>

                    {/* Écart de Caisse */}
                    <div className={`rounded-2xl p-4 flex items-center justify-between ${isNegative ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <div className="flex items-center gap-3">
                            {isNegative ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                            <span className="text-xs font-bold uppercase tracking-wider">Écart</span>
                        </div>
                        <span className="font-black text-xl">
                            {data.difference > 0 ? '+' : ''}{data.difference.toLocaleString()} F
                        </span>
                    </div>

                    {data.note && (
                        <div className="text-[10px] italic text-stone-400 border-l-2 border-stone-200 pl-3">
                            " {data.note} "
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 bg-stone-50 flex gap-3">
                    <Button 
                        onClick={onPrint}
                        className="flex-1 h-14 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 font-black uppercase tracking-widest text-xs gap-2"
                    >
                        <Printer size={18} /> Imprimer Ticket
                    </Button>
                </div>
            </div>
        </div>
    );
}