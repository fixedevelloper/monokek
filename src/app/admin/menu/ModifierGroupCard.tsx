import {useState} from "react";
import {Layers, Pencil, Plus, Save, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {ModifierItemForm} from "./ModifierItemForm";
import {toast} from "sonner";
import * as catalogApi from "../../../lib/api/catalog";
import {Modifier} from "../../../types/menus";

interface ModifierGroupCardProps {
    group: Modifier;
    isSelected: boolean;
    onToggle: (groupId: number) => void;
    onRefresh: () => void;
    onEditConfig: () => void;
}

function selectionRuleLabel(group: Modifier) {
    if (group.required) {
        return group.maxSelect != null
            ? `Obligatoire · ${group.minSelect || 1}-${group.maxSelect}`
            : `Obligatoire · min ${group.minSelect || 1}`;
    }
    if (group.maxSelect != null) return `Optionnel · max ${group.maxSelect}`;
    return "Optionnel";
}

export function ModifierGroupCard({ group, isSelected, onToggle, onRefresh, onEditConfig }: ModifierGroupCardProps) {
    const [showItemForm, setShowItemForm] = useState(false);
// Fonction de suppression d'un item
    const handleDeleteItem = async (e: React.MouseEvent, itemId: number) => {
        e.stopPropagation(); // Empêche de cocher/décocher le groupe au clic sur la croix

        if(!confirm("Supprimer cette option ?")) return;

        try {
            await catalogApi.deleteModifierItem(itemId);
            onRefresh(); // Invalide la cache pour rafraîchir l'affichage
            toast.success("Option supprimée");
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };
    return (
        <div
            className={`group w-full flex flex-col rounded-[2rem] border-2 transition-all duration-300 shrink-0 ${
                isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-slate-100 bg-white hover:border-slate-200"
            }`}
        >
            {/* SECTION HAUTE : Zone cliquable pour la sélection */}
            <div
                onClick={() => onToggle(group.id)}
                className="flex items-center justify-between gap-3 p-5 cursor-pointer select-none"
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                        isSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400"
                    }`}>
                        {isSelected ? <Save size={18} /> : <Layers size={18} />}
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-black uppercase text-sm tracking-tight leading-none text-slate-900 truncate">
                              {group.name}
                            </span>
                            <Badge
                                variant="outline"
                                className={`text-[8px] font-black uppercase px-1.5 py-0 rounded-md border-none shrink-0 ${
                                    group.type === "accompaniment" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                                }`}
                            >
                                {group.type === "accompaniment" ? "Accompagnement" : "Supplément"}
                            </Badge>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 truncate">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0"></span>
                            {group.items?.length || 0} options · {selectionRuleLabel(group)}
                        </span>
                    </div>
                </div>

                {/* Boutons d'édition indépendants du clic de sélection */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        onClick={(e) => { e.stopPropagation(); onEditConfig(); }}
                        title="Configurer la règle de sélection"
                    >
                        <Pencil size={14} />
                    </Button>
                    <Button
                        size="sm"
                        variant={showItemForm ? "default" : "secondary"}
                        className={`h-9 px-4 rounded-xl font-black text-[10px] transition-all ${
                            showItemForm ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        onClick={(e) => {
                            e.stopPropagation(); // Empêche de cocher/décocher le groupe
                            setShowItemForm(!showItemForm);
                        }}
                    >
                        {showItemForm ? "FERMER" : "OPTIONS"}
                        <Plus size={14} className={`ml-2 transition-transform duration-300 ${showItemForm ? "rotate-45" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* SECTION CENTRALE : Liste des badges (toujours visible) */}
            <div className="px-5 pb-5">
                <div className="flex flex-wrap gap-2">
                    {group.items?.length > 0 ? (
                        group.items.map((item) => (
                            <div
                                key={item.id}
                                className="group/item h-8 px-3 bg-white border border-slate-100 rounded-full flex items-center gap-2 shadow-sm hover:border-primary/30 transition-colors"
                            >
                                <span className="text-[10px] font-black text-slate-700 uppercase">{item.name}</span>
                                <div className="h-4 w-px bg-slate-100"/>
                                <span className="text-[10px] font-bold text-primary">{item.price} FCFA</span>
                                <button
                                    onClick={(e) => handleDeleteItem(e, item.id)}
                                    className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <X size={10} strokeWidth={3} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="py-2 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 italic">Aucune option. Cliquez sur CONFIGURER pour en ajouter.</span>
                        </div>
                    )}
                </div>

                {/* SECTION BASSE : Formulaire d'ajout (Conditionnel) */}
                {showItemForm && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                        <ModifierItemForm
                            groupId={group.id}
                            onActionComplete={onRefresh}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}