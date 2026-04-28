
"use client";
import { formatCurrency } from "../lib/formatCurrency";
import { CartItem, useCartStore } from "../store/use-cart-store";



import { toast as sonnerToast } from "sonner"; // Recommandé pour Next.js

/**
 * Hook utilitaire pour les notifications
 */
export const useToast = () => {
  const toast = ({ title, description, variant, duration = 3000 }: any) => {
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
  const addToCart = (product: any, variant?: any, selectedModifiers: any[] = []) => {
    try {
      // Calcul du prix total de l'item (Base + Variante + Modificateurs)
      const basePrice = variant ? parseFloat(variant.price) : parseFloat(product.price);
      const modifiersTotal = selectedModifiers.reduce((acc, m) => acc + parseFloat(m.price || 0), 0);
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
          price: parseFloat(m.price || 0)
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

  /**
   * Valide la commande et prépare l'objet pour l'API Laravel
   */
  const checkout = async (orderType: 'dinein' | 'takeaway', tableId?: string | number | null) => {
    if (cart.items.length === 0) {
      toast({ 
        title: "Panier vide", 
        description: "Veuillez ajouter des articles avant de commander",
        variant: "destructive" 
      });
      return null;
    }

    // Structure correspondant à tes migrations Laravel 'orders' et 'order_items'
    const orderPayload = {
      type: orderType,
      table_id: tableId,
      subtotal: cart.total, // Selon ta logique de calcul dans le store
      total: cart.total,
      status: 'pending',
      items: cart.items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        qty: item.qty,
        price: item.price,
        modifiers: item.modifiers?.map(m => m.id) || [], // Pour la table pivot order_item_modifiers
      })),
    };

    return orderPayload;
  };

  return {
    ...cart, // On expose toutes les méthodes du store (items, removeItem, clearCart, etc.)
    addToCart,
    checkout,
  };
};
