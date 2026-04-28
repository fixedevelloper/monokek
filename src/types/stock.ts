/**
 * Unités de mesure (kg, l, pcs)
 */
export interface Unit {
  id: number;
  name: string; // 'kg' | 'l' | 'pcs' | 'g' | 'ml'
}

/**
 * Interface principale pour un Ingrédient
 */
export interface Ingredient {
  id: number;
  name: string;
  stock: number;
  alert_qty: number;
  unit_id: number;
  unit?: string; // Soit l'objet Unit, soit juste le nom selon la Resource API
  created_at?: string;
  updated_at?: string;
  
  // Champs calculés (via Resource API)
  is_low_stock?: boolean;
}

/**
 * Éléments d'une recette
 */
export interface RecipeItem {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  qty: number;
  ingredient?: Ingredient; // Inclus lors d'un "with" dans Laravel
}

/**
 * Recette liée à un produit
 */
export interface Recipe {
  id: number;
  product_id: number;
  items: RecipeItem[];
}

/**
 * Historique des mouvements de stock
 */
export interface StockMovement {
  id: number;
  ingredient: Ingredient;
  type: 'in' | 'out' | 'adjust';
  qty: number;
  reason: string | null;
  created_at: string;
}

/**
 * Types pour les formulaires de création/édition
 */
export type CreateIngredientInput = Omit<Ingredient, 'id' | 'created_at' | 'updated_at' | 'is_low_stock'>;

export interface StockAdjustmentInput {
  qty: number;
  type: 'in' | 'out' | 'adjust';
  reason: string;
}