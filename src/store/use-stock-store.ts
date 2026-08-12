import api from "@/src/lib/axios";
import { create } from "zustand";
import { CreateIngredientInput, Ingredient, StockAdjustmentInput, StockMovement, Unit } from "../types/stock";

interface StockState {
  ingredients: Ingredient[];
  units: Unit[];
  isLoading: boolean;
  movements: StockMovement[];
fetchMovements: () => Promise<void>;
  fetchIngredients: () => Promise<void>;
  fetchUnits: () => Promise<void>;
  addIngredient: (data: CreateIngredientInput) => Promise<void>;
  adjustStock: (id: number, data: StockAdjustmentInput) => Promise<void>;
}

export const useStockStore = create<StockState>((set, get) => ({
  ingredients: [],
  units: [],
  movements: [],
  isLoading: false,

  fetchIngredients: async () => {
    set({ isLoading: true });
    try {
      // GET /api/admin/ingredients returns a bare JSON array, not an {data: [...]} envelope —
      // same class of bug as fetchMovements below: reading `data.data` always set this to undefined.
      const { data } = await api.get("/api/admin/ingredients");
      set({ ingredients: data ?? [] });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMovements: async () => {
    set({ isLoading: true });
    try {
      // GET /api/admin/stock-movements returns a bare Spring Data Page ({content, totalElements, ...}),
      // not the {data: [...]} ApiResponse envelope every other admin endpoint uses — reading `data.data`
      // here always set `movements` to undefined, crashing the page (TypeError on the .filter() below it)
      // the moment this resolved, regardless of whether there was any data.
      const { data } = await api.get("/api/admin/stock-movements");
      set({ movements: data.content ?? [] });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnits: async () => {
    try {
      // Same bare-array response shape as fetchIngredients above.
      const { data } = await api.get("/api/admin/units");
      set({ units: data ?? [] });
    } catch (e) {
      console.error(e);
    }
  },

  addIngredient: async (payload) => {
    try {
      // POST /api/admin/ingredients returns the created IngredientDto directly, not wrapped in {data: ...}.
      const { data } = await api.post("/api/admin/ingredients", payload);
      set({ ingredients: [data, ...get().ingredients] });
    } catch (e) {
      console.error(e);
    }
  },

  adjustStock: async (id: number, payload: StockAdjustmentInput) => {
    try {
      const { data } = await api.post(`/api/admin/ingredients/${id}/adjust`, payload);

      set((state) => ({
        ingredients: state.ingredients.map((ing) =>
          ing.id === id
            ? {
                ...ing,
                stock:
                  data.new_stock ??
                  (payload.type === "in"
                    ? ing.stock + payload.qty
                    : ing.stock - payload.qty),
              }
            : ing
        ),
      }));
    } catch (e) {
      console.error(e);
    }
  },
}));