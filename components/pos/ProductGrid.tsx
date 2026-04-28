"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types/models';

interface ProductGridProps {
  products: Product[];
  categories: any[];
}

export default function ProductGrid({ products, categories }: ProductGridProps) {
  const { addToCart } = useCart();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  // Filtrage intelligent
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                           product.sku?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory ? product.category_id === activeCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-background">
      
      {/* 1. Barre de Recherche et Filtres Rapides */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un plat ou un SKU..." 
            className="pl-10 h-12 text-lg shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 2. Sélecteur de Catégories (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button 
          variant={activeCategory === null ? "default" : "outline"}
          onClick={() => setActiveCategory(null)}
          className="rounded-full px-6 transition-all"
        >
          Tout
        </Button>
        {categories.map((cat) => (
          <Button 
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            onClick={() => setActiveCategory(cat.id)}
            className="rounded-full px-6 transition-all whitespace-nowrap"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* 3. Grille de Produits */}
      <div className="flex-1 overflow-y-auto pr-2">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence mode='popLayout'>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(product)}
                  className="group relative flex flex-col bg-card border rounded-2xl overflow-hidden cursor-pointer hover:border-primary transition-colors shadow-sm h-48"
                >
                  {/* Badge de prix */}
                  <div className="absolute top-2 right-2 z-10 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md">
                    {formatCurrency(product.price)}
                  </div>

                  {/* Placeholder Image ou Image du produit */}
                  <div className="flex-1 bg-muted flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Info Produit */}
                  <div className="p-3 bg-card border-t">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <Search className="h-12 w-12 mb-2" />
            <p>Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}