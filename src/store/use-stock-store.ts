import api from "@/src/lib/axios";
import { create } from "zustand";
import { Ingredient, StockMovement, Unit } from "../types/stock";

interface StockState {
  ingredients: Ingredient[];
  units: Unit[];
  isLoading: boolean;
  movements: StockMovement[];
fetchMovements: () => Promise<void>;
  fetchIngredients: () => Promise<void>;
  fetchUnits: () => Promise<void>;
  addIngredient: (data: any) => Promise<void>;
  adjustStock:(id:any,data:any)=> Promise<void>;
}

export const useStockStore = create<StockState>((set, get) => ({
  ingredients: [],
  units: [],
  movements: [],
  isLoading: false,

  fetchIngredients: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/api/admin/ingredients");
      set({ ingredients: data.data });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMovements: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/api/admin/stock-movements");
      set({ movements: data.data });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnits: async () => {
    try {
      const { data } = await api.get("/api/admin/units");
      set({ units: data.data });
    } catch (e) {
      console.error(e);
    }
  },

  addIngredient: async (payload) => {
    try {
      const { data } = await api.post("/api/admin/ingredients", payload);
      set({ ingredients: [data.data, ...get().ingredients] });
    } catch (e) {
      console.error(e);
    }
  },

  adjustStock: async (id: number, payload: any) => {
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