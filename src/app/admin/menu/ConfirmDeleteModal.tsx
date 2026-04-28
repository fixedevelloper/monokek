import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash } from "lucide-react";

export function ConfirmDeleteModal({ open, onOpenChange, onConfirm, loading, title, description }: any) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
        <AlertDialogHeader>
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4">
            <Trash size={24} />
          </div>
          <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 font-medium">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 mt-6">
          <AlertDialogCancel className="rounded-2xl h-12 border-none bg-slate-100 font-bold uppercase text-[10px]">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="rounded-2xl h-12 bg-red-600 hover:bg-red-700 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}