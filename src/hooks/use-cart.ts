
"use client";
import { formatCurrency } from "../lib/formatCurrency";
import { CartItem, useCartStore } from "../store/use-cart-store";
import { ModifierItem, Product } from "@/src/types/menus";



import { toast as sonnerToast } from "sonner"; // Recommandé pour Next.js

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface CartVariant {
  id: number;
  name: string;
  price: number | string;
}

/**
 * Hook utilitaire pour les notifications
 */
export const useToast = () => {
  const toast = ({ title, description, variant, duration = 3000 }: ToastOptions) => {
    const options = {
      description,
      duration,
    };

    if (variant === "destructive") {
      return sonnerToast.error(title, options);
    }
    return sonnerToast.success(title, options);
  };

  return { toast };
};

/**
 * Hook personnalisé pour la logique métier du panier
 */
export const useCart = () => {
  const cart = useCartStore();
  const { toast } = useToast();

  /**
   * Ajoute un produit avec validation et calcul de prix
   */
  const addToCart = (product: Product, variant?: CartVariant, selectedModifiers: ModifierItem[] = []) => {
    try {
      // Calcul du prix total de l'item (Base + Variante + Modificateurs)
      const basePrice = variant ? Number(variant.price) : product.price;
      const modifiersTotal = selectedModifiers.reduce((acc, m) => acc + (m.price || 0), 0);
      const finalPrice = basePrice + modifiersTotal;

      const cartItem: CartItem = {
        product_id: product.id,
        name: product.name,
        variant_id: variant?.id,
        variant_name: variant?.name,
        qty: 1,
        price: finalPrice,
        modifiers: selectedModifiers.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price || 0,
          quantity: m.quantity
        })),
        id: ""
      };

      cart.addItem(cartItem);

      toast({
        title: "Ajouté au panier",
        description: `${product.name} ${variant ? `(${variant.name})` : ''} - ${formatCurrency(finalPrice)}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'article",
        variant: "destructive"
      });
    }
  };

  return {
    ...cart, // On expose toutes les méthodes du store (items, removeItem, clearCart, etc.)
    addToCart,
  };
};
