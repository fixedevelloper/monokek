"use client";

import React, { useState } from "react";
import { ArrowLeft, FileUp, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/src/lib/axios";
import Link from "next/link";
import Papa from "papaparse"; // Import pour le CSV
import { useRouter } from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";

export default function ImportProductsPage() {
    const [fileData, setFileData] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation du type de fichier
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            return toast.error("Veuillez uploader un fichier au format CSV.");
        }

        Papa.parse(file, {
            header: true, // Utilise la première ligne comme clés d'objet
            skipEmptyLines: true,
            complete: (results) => {
                // On valide que le CSV a les bonnes colonnes (name, price, category)
                if (results.data.length > 0) {
                    setFileData(results.data);
                    toast.success(`${results.data.length} produits détectés.`);
                } else {
                    toast.error("Le fichier semble vide.");
                }
            },
            error: (error) => {
                toast.error("Erreur lors de la lecture du fichier.");
            }
        });
    };

    const confirmImport = async () => {
        if (fileData.length === 0) return;

        setIsUploading(true);
        try {
            // On envoie les données au backend Laravel
            await api.post("/api/admin/products/bulk-import", { items: fileData });
            toast.success("Importation réussie !");
            queryClient.invalidateQueries({ queryKey: ["products"] });
            router.push("/admin/menu");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de l'importation finale.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm" asChild>
                        <Link href="/admin/menu"><ArrowLeft size={20} /></Link>
                    </Button>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                        Preview <span className="text-primary">Import</span>
                    </h2>
                </div>

                {fileData.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => setFileData([])} className="rounded-xl gap-2">
                        <Trash2 size={16} /> Recommencer
                    </Button>
                )}
            </div>

            {fileData.length === 0 ? (
                <div className="group relative border-4 border-dashed border-slate-200 rounded-[3rem] p-20 text-center bg-white hover:border-primary/50 transition-colors">
                    <input type="file" onChange={handleFileUpload} id="csv-upload" className="hidden" accept=".csv" />
                    <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors mb-6">
                            <FileUp size={40} />
                        </div>
                        <p className="font-black uppercase text-slate-400 tracking-widest text-sm">
                            Cliquez pour uploader un fichier CSV
                        </p>
                        <p className="text-slate-300 text-xs mt-2 font-bold">Colonnes requises : name, price, category</p>
                    </label>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Infos Recap */}
                    <div className="flex gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 flex-1">
                            <CheckCircle2 className="text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-800">{fileData.length} articles prêts à l'importation</span>
                        </div>
                    </div>

                    {/* Tableau de Preview */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b">
                            <tr>
                                <th className="p-5 text-[10px] font-black uppercase text-slate-400">Article</th>
                                <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">Catégorie</th>
                                <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-right">Prix</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                            {fileData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5 text-sm font-black uppercase italic tracking-tight">{row.name}</td>
                                    <td className="p-5 text-center text-xs font-bold">
                                        <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase">{row.category}</span>
                                    </td>
                                    <td className="p-5 text-right font-black text-primary">{row.price} FCFA</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end items-center gap-4 pt-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vérifiez bien les données avant de valider</p>
                        <Button
                            onClick={confirmImport}
                            disabled={isUploading}
                            className="h-16 px-12 rounded-[2rem] font-black text-lg italic shadow-xl shadow-primary/20"
                        >
                            {isUploading ? "IMPORTATION EN COURS..." : "LANCER L'IMPORTATION"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}