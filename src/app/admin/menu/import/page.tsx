"use client";

import React, {useState} from "react";
import {ArrowLeft, CheckCircle2, FileUp, Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import * as catalogApi from "@/src/lib/api/catalog";
import Link from "next/link";
import Papa from "papaparse"; // Import pour le CSV
import {useRouter} from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";
import {getErrorMessage} from "@/src/lib/errors";
import * as storageApi from "@/src/lib/api/storage";
import {ArchiveRow, parseProductsArchive} from "@/src/lib/productArchive";

type ImportRow = ArchiveRow;

const norm = (v?: string) => (v ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const rowKey = (r: ImportRow) => `${norm(r.category)}|${norm(r.name)}`;

export default function ImportProductsPage() {
    const [fileData, setFileData] = useState<ImportRow[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
    const [existing, setExisting] = useState<Set<string>>(new Set());
    const [images, setImages] = useState<Map<string, Blob>>(new Map());
    const router = useRouter();
    const queryClient = useQueryClient();
    // Doublon = même catégorie + même nom (insensible à la casse) qu'un produit existant de la succursale
    // ciblée, ou qu'une ligne précédente du fichier. Le serveur applique la même règle en filet de sécurité.
    const duplicates = React.useMemo(() => {
        const seen = new Set<string>();
        return fileData.map((row) => {
            const key = rowKey(row);
            const dup = existing.has(key) || seen.has(key);
            seen.add(key);
            return dup;
        });
    }, [fileData, existing]);
    const newCount = duplicates.filter((d) => !d).length;

    const loadExisting = () => {
        const branch = Number(new URLSearchParams(window.location.search).get("branch")) || null;
        catalogApi.listProductsAdmin()
            .then((all) => setExisting(new Set(all
                .filter((p) => branch === null || p.category.branch_id === branch)
                .map((p) => rowKey({category: p.category.name, name: p.name})))))
            .catch(() => setExisting(new Set())); // pas bloquant : le serveur ignore aussi les doublons
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.name.toLowerCase().endsWith(".zip")) {
            parseProductsArchive(file)
                .then(({rows, images: imgs}) => {
                    if (rows.length === 0) return toast.error("Le fichier semble vide.");
                    loadExisting();
                    setFileData(rows);
                    setImages(imgs);
                    toast.success(`${rows.length} produits et ${imgs.size} images détectés.`);
                })
                .catch((e) => toast.error(getErrorMessage(e, "Archive illisible.")));
            return;
        }

        // Validation du type de fichier
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            return toast.error("Veuillez uploader un fichier au format CSV.");
        }

        Papa.parse<ImportRow>(file, {
            header: true, // Utilise la première ligne comme clés d'objet
            skipEmptyLines: true,
            complete: (results) => {
                // On valide que le CSV a les bonnes colonnes (name, price, category)
                if (results.data.length > 0) {
                    loadExisting();
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
        const rowsToImport = fileData.filter((_, i) => !duplicates[i]);
        if (rowsToImport.length === 0) return toast.info("Tous ces produits existent déjà : rien à importer.");

        setIsUploading(true);
        try {
            // Images du zip → MinIO d'abord (4 en parallèle) ; un échec d'envoi n'annule pas l'import.
            const urls = new Map<string, string>();
            const wanted = new Set(rowsToImport.map((r) => (r.image_file ?? '').trim().replace(/\\/g, '/')));
            const paths = [...images.keys()].filter((p) => wanted.has(p));
            let done = 0, failed = 0, next = 0;
            await Promise.all(Array.from({length: Math.min(4, paths.length)}, async () => {
                while (next < paths.length) {
                    const path = paths[next++];
                    try {
                        const blob = images.get(path)!;
                        const file = new File([blob], path.split("/").pop() ?? "image", {type: blob.type});
                        urls.set(path, await storageApi.uploadImage(file, "products"));
                    } catch {
                        failed++;
                    }
                    setProgress(`Images ${++done}/${paths.length}`);
                }
            }));
            setProgress("Création des produits…");
            await catalogApi.bulkImportProducts({
                // TODO: pas de sélecteur de succursale dans cette UI — branche par défaut,
                // comme le hardcodage Branch::first() de l'ancienne version Laravel.
                branchId: Number(new URLSearchParams(window.location.search).get("branch")) || 1,
                items: rowsToImport.map((row) => ({
                    name: String(row.name ?? ''),
                    price: parseFloat(row.price ?? '') || 0,
                    category: String(row.category ?? ''),
                    description: row.description?.trim() || undefined,
                    image: urls.get((row.image_file ?? '').trim().replace(/\\/g, '/')),
                })),
            });
            if (failed > 0) toast.warning(`${failed} image(s) n'ont pas pu être envoyées.`);
            toast.success("Importation réussie !");
            queryClient.invalidateQueries({ queryKey: ["products"] });
            router.push("/admin/menu");
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de l'importation finale."));
        } finally {
            setIsUploading(false);
            setProgress(null);
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
                    <Button variant="destructive" size="sm" onClick={() => { setFileData([]); setImages(new Map()); }} className="rounded-xl gap-2">
                        <Trash2 size={16} /> Recommencer
                    </Button>
                )}
            </div>

            {fileData.length === 0 ? (
                <div className="group relative border-4 border-dashed border-slate-200 rounded-[3rem] p-20 text-center bg-white hover:border-primary/50 transition-colors">
                    <input type="file" onChange={handleFileUpload} id="csv-upload" className="hidden" accept=".csv,.zip" />
                    <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors mb-6">
                            <FileUp size={40} />
                        </div>
                        <p className="font-black uppercase text-slate-400 tracking-widest text-sm">
                            Cliquez pour uploader un fichier CSV ou ZIP (avec images)
                        </p>
                        <p className="text-slate-300 text-xs mt-2 font-bold">Colonnes : name, price, category (+ description, image_file avec un zip)</p>
                    </label>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Infos Recap */}
                    <div className="flex gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 flex-1">
                            <CheckCircle2 className="text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-800">{newCount} articles prêts à l'importation{newCount < fileData.length ? ` · ${fileData.length - newCount} doublon(s) ignoré(s)` : ""}{images.size > 0 ? ` (${images.size} images)` : ""}</span>
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
                                <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${duplicates[i] ? "opacity-40" : ""}`}>
                                    <td className="p-5 text-sm font-black uppercase italic tracking-tight">{row.name}{duplicates[i] && <span className="ml-2 text-[10px] not-italic font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Déjà existant</span>}</td>
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
                            disabled={isUploading || newCount === 0}
                            className="h-16 px-12 rounded-[2rem] font-black text-lg italic shadow-xl shadow-primary/20"
                        >
                            {isUploading ? (progress ?? "IMPORTATION EN COURS...") : "LANCER L'IMPORTATION"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}