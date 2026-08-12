"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ImageIcon, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import * as storageApi from "@/src/lib/api/storage";
import { StorageImage } from "@/src/lib/api/storage";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo — doit matcher StorageService.MAX_SIZE_BYTES côté backend

interface ImagePickerModalProps {
    /** Called with the chosen (existing or freshly uploaded) image URL. */
    onSelect: (url: string) => void;
    /** MinIO folder to browse/upload into, e.g. "products". Defaults to "uploads". */
    folder?: string;
    /** Custom element that opens the modal. Defaults to a "Choisir une image" button. */
    trigger?: React.ReactNode;
}

export function ImagePickerModal({ onSelect, folder = "uploads", trigger }: ImagePickerModalProps) {
    const [open, setOpen] = useState(false);
    const [images, setImages] = useState<StorageImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadImages = async () => {
        setLoading(true);
        try {
            const data = await storageApi.listImages(folder);
            setImages(data);
            setLoaded(true);
        } catch (error) {
            toast.error("Impossible de charger la bibliothèque d'images");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (next && !loaded) {
            loadImages();
        }
    };

    const handlePick = (url: string) => {
        onSelect(url);
        setOpen(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error("Format non supporté (jpeg, png, webp, gif uniquement)");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            toast.error("Fichier trop volumineux (5 Mo maximum)");
            e.target.value = "";
            return;
        }

        setUploading(true);
        try {
            const url = await storageApi.uploadImage(file, folder);
            toast.success("Image envoyée !");
            onSelect(url);
            setOpen(false);
        } catch (error) {
            toast.error("Échec de l'envoi de l'image");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button type="button" variant="outline" className="h-11 rounded-2xl font-bold text-xs gap-2">
                        <ImagePlus size={16} /> Choisir une image
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2">
                        <ImageIcon className="text-primary" /> Bibliothèque d&apos;images
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="library" className="gap-4">
                    <TabsList className="self-center">
                        <TabsTrigger value="library" className="text-xs font-bold uppercase px-4">Bibliothèque</TabsTrigger>
                        <TabsTrigger value="upload" className="text-xs font-bold uppercase px-4">Ajouter</TabsTrigger>
                    </TabsList>

                    <TabsContent value="library">
                        <ScrollArea className="h-80 rounded-2xl">
                            {loading ? (
                                <div className="flex items-center justify-center h-80 text-muted-foreground gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
                                </div>
                            ) : images.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-80 gap-2 text-muted-foreground">
                                    <ImageIcon className="h-8 w-8" />
                                    <span className="text-xs font-bold uppercase">Aucune image pour l&apos;instant</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3 p-1 pr-3">
                                    {images.map((img) => (
                                        <button
                                            key={img.key}
                                            type="button"
                                            onClick={() => handlePick(img.url)}
                                            className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent bg-muted/30 hover:border-primary transition-all"
                                        >
                                            <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="upload">
                        <label
                            className={`flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-2xl gap-3 transition-colors ${
                                uploading ? "border-muted-foreground/20 bg-muted/10" : "border-muted-foreground/20 bg-muted/10 hover:border-primary cursor-pointer"
                            }`}
                        >
                            {uploading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : (
                                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            )}
                            <span className="text-xs font-black uppercase text-muted-foreground text-center px-6">
                                {uploading ? "Envoi en cours..." : "Cliquez pour choisir un fichier"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">JPEG, PNG, WEBP ou GIF — 5 Mo max</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_TYPES.join(",")}
                                className="hidden"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </label>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
