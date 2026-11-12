"use client";

import React, {useEffect, useRef, useState} from "react";
import {ArrowLeft, BookOpen, ChefHat, Download, FileUp, Loader2, Package, Search, Trash2, UtensilsCrossed,} from "lucide-react";
// UI Components
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {toast} from "sonner";
import {formatCurrency} from "@/src/lib/formatCurrency";
import {AddProductModal} from "./AddProductModal";
import {AddCategoryModal} from "./AddCategoryModal";
import {EditCategoryModal} from "./EditCategoryModal";
import * as catalogApi from "@/src/lib/api/catalog";
import * as companyApi from "@/src/lib/api/company";
import * as kitchenStationApi from "@/src/lib/api/kitchenStation";
import * as stockApi from "@/src/lib/api/stock";
import {useAuthStore} from "@/src/store/use-auth-store";
import {Category, Product} from "@/src/types/menus";
import {Branch} from "@/src/types/company";
import {EditProductModal} from "./EditProductModal";
import {AdjustProductStockModal} from "./AdjustProductStockModal";
import {ProductBranchesDialog} from "./ProductBranchesDialog";
import {CategoryBranchesDialog} from "./CategoryBranchesDialog";
import {DuplicatesDialog} from "./DuplicatesDialog";
import {ConfirmDeleteModal} from "./ConfirmDeleteModal";
import {useAuth} from "@/src/hooks/use-auth";
import {PERMISSIONS} from "@/src/constants/roles";
import Link from "next/link";
import {getErrorMessage} from "@/src/lib/errors";
import {RecipeSheet} from "./RecipeSheet";
import {SupplementSheet} from "./SupplementSheet";
import {useInfiniteQuery, useQuery, useQueryClient} from '@tanstack/react-query';
import {useDebouncedValue} from "@/src/hooks/use-debounced-value";
import {buildProductsArchive, saveBlob} from "@/src/lib/productArchive";

/** Query-key prefix shared by every branch section's infinite query — react-query
 * matches by prefix, so invalidating this one key refreshes every open section at once. */
const PRODUCTS_PAGE_KEY = ['products', 'admin', 'page'];

export default function AdminMenuPage() {
    const [searchQuery, setSearchQuery] = useState("");
    // L'input reste réactif à chaque frappe ; seul le filtrage (et le re-render
    // de la grille de produits qu'il déclenche) attend 250ms d'inactivité.
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);
    const [openDelete, setOpenDelete] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const queryClient = useQueryClient();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isRecipeOpen, setIsRecipeOpen] = useState(false);
    const [isSupplementOpen, setIsSupplementeOpen] = useState(false);
    // Onglet de branche actif — la grille de produits (et sa requête paginée) n'existe
    // que pour cette branche-là ; changer d'onglet démonte l'ancienne section (Radix ne
    // garde en vie que le TabsContent actif) et en monte une nouvelle, dont le résultat
    // reste en cache react-query si on y revient.
    const [activeBranchId, setActiveBranchId] = useState<number | null>(null);
    const [exportStatus, setExportStatus] = useState<string | null>(null);

    // Export du catalogue de la succursale affichée : produits.csv + images/ dans un zip.
    const exportCatalog = async () => {
        if (exportStatus !== null) return;
        setExportStatus("Préparation…");
        try {
            const all = await catalogApi.listProductsAdmin();
            const products = all.filter((p) => activeBranchId === null || p.category.branch_id === activeBranchId);
            if (products.length === 0) return void toast.error("Aucun produit à exporter.");
            const result = await buildProductsArchive(products, (done, total) => setExportStatus(`Images ${done}/${total}`));
            const date = new Date().toISOString().slice(0, 10);
            if (!(await saveBlob(result.blob, `produits-${date}.zip`))) return;
            if (result.failedImages.length > 0) {
                toast.warning(`${result.total} produits exportés, ${result.failedImages.length} image(s) non récupérée(s) : ${result.failedImages.slice(0, 3).join(", ")}${result.failedImages.length > 3 ? "…" : ""}`);
            } else {
                toast.success(`${result.total} produits exportés (${result.withImage} images).`);
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Erreur lors de l'export."));
        } finally {
            setExportStatus(null);
        }
    };

    const openRecipe = (product: Product) => {
        setSelectedProduct(product);
        setIsRecipeOpen(true);
    };
    const openSupplement = (product: Product) => {
        setSelectedProduct(product);
        setIsSupplementeOpen(true);
    };
    const {
        data: allModifiersGroups = [],
    } = useQuery({
        queryKey: ['modifier-groups'],
        queryFn: () => catalogApi.listModifiers(),
        // Optionnel : Garder les données fraîches pendant 5 minutes
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: categoriesData,
        isLoading: isCategoriesLoading
    } = useQuery({
        queryKey: ["categories"],
        queryFn: () => catalogApi.listCategoriesAdmin(),
    });
    const categories = categoriesData || [];

    // Chargées ici (pas dans AddCategoryModal) pour que le sélecteur de succursale du modal
    // reçoive une liste déjà disponible en prop, comme RegisterDialog/StationDialog — un fetch
    // interne au modal laissait une fenêtre asynchrone pendant laquelle un re-render de cette
    // page (ex: refetch de ["categories"]) réinitialisait le Select à vide. Chaque branche
    // devient ensuite sa propre section de produits à scroll infini, voir BranchProductSection.
    const { data: branches = [], isLoading: isBranchesLoading } = useQuery({
        queryKey: ['branches-for-menu'],
        queryFn: () => companyApi.listBranches(),
    });

    const isLoading = isCategoriesLoading || isBranchesLoading;

    // Sélectionne la première branche par défaut dès qu'elles arrivent (et si l'onglet
    // actif ne correspond plus à une branche existante, ex. après suppression).
    useEffect(() => {
        if (branches.length === 0) return;
        if (!branches.some((b: Branch) => b.id === activeBranchId)) {
            setActiveBranchId(branches[0].id);
        }
    }, [branches, activeBranchId]);

    const isOwner = useAuthStore((s) => s.user?.role === 'admin' && !s.user?.branch_id);
    const refreshMenu = () => {
        queryClient.invalidateQueries({ queryKey: PRODUCTS_PAGE_KEY });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
    };

    const handleDelete = async () => {
        if (!selectedId) return;

        try {
            setLoadingDelete(true);

            await catalogApi.deleteProduct(selectedId);
            toast.success("Produit supprimé !");
            setOpenDelete(false);
            refreshMenu(); // refresh list

        } catch (error) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setLoadingDelete(false);
        }
    };

    const handleDeleteRequested = (id: number) => {
        setSelectedId(id);
        setOpenDelete(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-20">

            {/* HEADER DYNAMIQUE */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-100 shrink-0" asChild>
                            <Link href="/admin"><ArrowLeft size={20}/></Link>
                        </Button>

                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                                Gestion du <span className="text-primary">Menu</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Barre de Recherche */}
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Rechercher un plat..."
                                className="pl-11 h-12 w-full sm:w-64 rounded-2xl bg-white border-none shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* ACTIONS : Import + Add */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Nouveau Bouton Import */}
                            <Button
                                variant="outline"
                                className="h-12 px-5 rounded-2xl border-none bg-white shadow-sm font-bold gap-2 hover:bg-slate-50 transition-all"
                                asChild
                            >
                                <Link href={activeBranchId ? `/admin/menu/import?branch=${activeBranchId}` : "/admin/menu/import"}>
                                    <FileUp size={18} className="text-primary" />
                                    <span className="hidden lg:inline">Importation Masse</span>
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                disabled={exportStatus !== null || activeBranchId === null}
                                onClick={exportCatalog}
                                className="h-12 px-5 rounded-2xl border-none bg-white shadow-sm font-bold gap-2 hover:bg-slate-50 transition-all"
                            >
                                {exportStatus !== null ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} className="text-primary"/>}
                                <span className="hidden lg:inline">{exportStatus ?? "Exporter"}</span>
                            </Button>

                            {isOwner && <DuplicatesDialog onMerged={refreshMenu}/>}

                            <AddProductModal onProductAdded={refreshMenu} categories={categories}/>
                        </div>
                    </div>
                </div>
            </header>

            {/* GRILLE DE PRODUITS — un onglet par branche, chacun avec son propre scroll infini.
                Radix ne monte que le TabsContent actif : changer d'onglet coupe la requête de
                l'ancienne branche au lieu de charger les deux en parallèle. */}
            <main className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="grid grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-64 bg-slate-200 rounded-[2rem]"/>)}
                    </div>
                ) : activeBranchId === null ? (
                    <p className="text-center text-muted-foreground text-sm py-20">Aucune branche configurée.</p>
                ) : (
                    <Tabs value={String(activeBranchId)} onValueChange={(v) => setActiveBranchId(Number(v))}>
                        <TabsList className="mb-6">
                            {branches.map((branch: Branch) => (
                                <TabsTrigger key={branch.id} value={String(branch.id)} className="text-xs font-bold uppercase px-4">
                                    {branch.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {branches.map((branch: Branch) => (
                            <TabsContent key={branch.id} value={String(branch.id)}>
                                <BranchProductSection
                                    branch={branch}
                                    search={debouncedSearchQuery}
                                    categories={categories}
                                    onCategoriesChanged={refreshMenu}
                                    onDeleteRequested={handleDeleteRequested}
                                    onOpenSupplement={openSupplement}
                                    onOpenRecipe={openRecipe}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </main>
            <ConfirmDeleteModal
                open={openDelete}
                onOpenChange={setOpenDelete}
                onConfirm={handleDelete}
                loading={loadingDelete}
                title="Supprimer ce produit ?"
                description="Cette action supprimera définitivement le produit du menu."
            />
            <RecipeSheet
                product={selectedProduct}
                open={isRecipeOpen}
                onOpenChange={setIsRecipeOpen}
            />
            <SupplementSheet
                product={selectedProduct}
                open={isSupplementOpen}
                onOpenChange={setIsSupplementeOpen}
                allModifiersGroups={allModifiersGroups || []}
                isLoadingGroups={isLoading}
            />
        </div>
    );
}

/**
 * Une branche = une requête paginée indépendante (`GET /api/admin/products/page`),
 * avec son propre scroll infini (IntersectionObserver sur une sentinelle en bas de
 * grille). Montée uniquement pendant que son onglet est actif (voir AdminMenuPage) —
 * changer d'onglet démonte cette section, react-query garde le résultat en cache si on
 * y revient, et le filtre catégorie repart à "Tout" (chaque branche a ses propres
 * catégories, un id de catégorie d'une autre branche n'aurait aucun sens ici).
 */
function BranchProductSection({branch, search, categories, onCategoriesChanged, onDeleteRequested, onOpenSupplement, onOpenRecipe}: {
    branch: Branch;
    search: string;
    categories: Category[];
    onCategoriesChanged: () => void;
    onDeleteRequested: (id: number) => void;
    onOpenSupplement: (product: Product) => void;
    onOpenRecipe: (product: Product) => void;
}) {
    const [categoryId, setCategoryId] = useState<number | null>(null);
    // Le partage entre succursales est une décision du propriétaire (le serveur le vérifie aussi).
    const isOwnerRole = useAuthStore((s) => s.user?.role === 'admin');
    // Le stock d'un produit est tenu par lieu : les ajustements de cet onglet visent le lieu de SA succursale.
    const { data: stockLocations = [] } = useQuery({
        queryKey: ['stock-locations'],
        queryFn: stockApi.listStockLocations,
        staleTime: 60_000,
    });
    const branchLocationId = stockLocations.find((l) => l.kind === 'BRANCH' && l.branchId === branch.id)?.id;

    // Stations utilisables par les catégories de CETTE succursale : les siennes + celles de sa cuisine centrale
    // (hub) si elle en a une. Rechargées par succursale : le serveur refuse toute autre station.
    const { data: kitchenStations = [] } = useQuery({
        queryKey: ['usable-stations', branch.id],
        queryFn: () => kitchenStationApi.listUsableStations(branch.id),
    });
    const branchCategories = React.useMemo(
        () => categories
            .filter((c) => (c.branch_ids ?? [c.branch_id]).includes(branch.id))
            // la station affichée / modifiée ici est celle de CETTE succursale
            .map((c) => (c.branch_stations && branch.id in c.branch_stations ? { ...c, kitchen_station_id: c.branch_stations[branch.id] } : c)),
        [categories, branch.id]
    );

    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: [...PRODUCTS_PAGE_KEY, branch.id, categoryId, search],
        queryFn: ({pageParam}) => catalogApi.listProductsAdminPage({
            branchId: branch.id,
            categoryId: categoryId ?? undefined,
            search: search || undefined,
            page: pageParam,
        }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    });

    const products = React.useMemo(() => data?.pages.flatMap((p) => p.content) ?? [], [data]);
    const total = data?.pages[0]?.totalElements ?? 0;

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
        <section>
            {/* Catégories de CETTE branche uniquement */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                    variant={categoryId === null ? "default" : "secondary"}
                    onClick={() => setCategoryId(null)}
                    className="rounded-full px-6 font-bold uppercase text-[10px]"
                >
                    Tout
                </Button>

                {branchCategories.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex items-center gap-1 rounded-full pl-6 pr-2 h-10 font-bold uppercase text-[10px] transition-all cursor-pointer ${
                            categoryId === cat.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                    >
                        {cat.name}
                        {isOwnerRole && <CategoryBranchesDialog category={cat}/>}
                        <EditCategoryModal
                            category={cat}
                            kitchenStations={kitchenStations}
                            branchId={branch.id}
                            onCategoryUpdated={onCategoriesChanged}
                        />
                    </div>
                ))}

                <AddCategoryModal onCategoryAdded={onCategoriesChanged} branches={[branch]} kitchenStations={kitchenStations} />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 bg-slate-200 rounded-[2rem]"/>)}
                </div>
            ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-20">Aucun produit dans cette branche.</p>
            ) : (
                <>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                        {total} article{total > 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                categories={categories}
                                locationId={branchLocationId}
                                onDeleteRequested={onDeleteRequested}
                                onOpenSupplement={onOpenSupplement}
                                onOpenRecipe={onOpenRecipe}
                            />
                        ))}
                    </div>
                    {/* Sentinelle invisible : dès qu'elle entre dans le viewport, la page suivante charge. */}
                    <div ref={sentinelRef} className="h-1" />
                    {isFetchingNextPage && (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

function ProductCard({product, categories, locationId, onDeleteRequested, onOpenSupplement, onOpenRecipe}: {
    product: Product;
    /** Lieu de stock de la succursale de l'onglet. */
    locationId?: number;
    categories: Category[];
    onDeleteRequested: (id: number) => void;
    onOpenSupplement: (product: Product) => void;
    onOpenRecipe: (product: Product) => void;
}) {
    const {can} = useAuth();
    // Le partage entre succursales est une décision du propriétaire (le serveur le vérifie aussi).
    const isOwnerRole = useAuthStore((s) => s.user?.role === 'admin');
    return (
        <div className="animate-in fade-in zoom-in-95 duration-200">
            <Card
                className="group overflow-hidden rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 transition-all hover:shadow-xl">
                <div
                    className="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            // h-48 = 12rem (192px), w-48 = 12rem
                            // object-cover est indispensable pour ne pas écraser l'image
                            className="h-48 w-58 object-cover rounded-2xl"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <UtensilsCrossed className="text-slate-300 dark:text-slate-700"
                                         size={48}/>
                    )}
                    <div className="absolute top-4 left-4">
                        <Badge
                            className="bg-white/90 text-black border-none text-[9px] font-black uppercase">{product.category.name}</Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                                                                 <span
                                                                     className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                                         product.type === 'storable'
                                                                             ? 'bg-blue-100 text-blue-600'
                                                                             : 'bg-orange-100 text-orange-600'
                                                                     }`}>
    {product.type === 'storable' ? '📦 Storage' : '🍳 Consom'}
</span>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                        <div className="flex gap-1">
                            {product.type === "storable" && can(PERMISSIONS.MANAGE_STOCK) && (
                                <AdjustProductStockModal product={product} onUpdated={() => {}} locationId={locationId}/>
                            )}
                            {isOwnerRole && <ProductBranchesDialog product={product}/>}
                            <EditProductModal product={product} categories={categories}
                                              onProductUpdated={function (): void {

                                              }}/>
                            <Button
                                onClick={() => onDeleteRequested(product.id)}
                                size="icon" variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600">
                                <Trash2 size={14}/>
                            </Button>
                        </div>
                    </div>

                    {product.type === 'storable' && (
                        <div className="space-y-1.5 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Package size={14} className={product.stock_count <= 0 ? "text-red-500" : "text-slate-400"} />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Disponibilité
                </span>
                                </div>

                                {/* Badge d'état dynamique */}
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase italic ${
                                    product.stock_count <= 0 ? 'bg-red-100 text-red-600' :
                                        product.stock_count < 10 ? 'bg-amber-100 text-amber-600' :
                                            'bg-emerald-100 text-emerald-600'
                                }`}>
                {product.stock_count <= 0 ? 'Rupture' : product.stock_count < product.alert_stock ? 'Bas' : 'OK'}
            </span>
                            </div>

                            {/* Barre de progression visuelle */}
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${
                                        product.stock_count <= 0 ? 'w-0' :
                                            product.stock_count < 10 ? 'bg-amber-500 w-1/4' :
                                                'bg-emerald-500 w-full'
                                    }`}
                                />
                            </div>

                            <p className={`text-[10px] font-black ${product.stock_count < 5 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                                {product.stock_count} UNITÉS EN RÉSERVE
                            </p>
                        </div>
                    )}


                    <div
                        className="flex justify-between items-center pt-4 border-t border-dashed">
                                                <span className="text-2xl font-black text-primary tracking-tighter">
                                                    {formatCurrency(product.price)}
                                                </span>

                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-dashed">
                        <Button
                            variant="secondary"
                            onClick={() => onOpenSupplement(product)}
                            className="flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 h-11 bg-slate-100 hover:bg-primary hover:text-white transition-all group"
                        >
                            <ChefHat size={16} className="group-hover:rotate-12 transition-transform" />
                            Suppléments
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => onOpenRecipe(product)}
                            className="flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 h-11 bg-slate-50 border border-slate-100 hover:border-primary transition-all"
                        >
                            <BookOpen size={16} />
                            Recette
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}