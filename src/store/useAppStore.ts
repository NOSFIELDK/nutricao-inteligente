import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CatalogItem, Favorite, MealSlot, PlanItem, UserProfile } from "@/domain/models";
import { STORAGE_KEYS } from "@/storage/keys";
import { uid } from "@/utils/id";

type AppState = {
  profile: UserProfile | null;
  favorites: Favorite[];
  plan: PlanItem[];
  shoppingChecked: Record<string, boolean>;

  setProfile: (profile: UserProfile) => void;
  clearProfile: () => void;

  toggleFavorite: (item: CatalogItem) => void;
  isFavorite: (item: CatalogItem) => boolean;

  addToPlan: (params: { item: CatalogItem; dateISO: string; mealSlot: MealSlot; servings?: number }) => void;
  removeFromPlan: (id: string) => void;
  setPlanItemServings: (id: string, servings: number) => void;
  clearPlan: () => void;

  setShoppingChecked: (key: string, checked: boolean) => void;
  clearShoppingChecked: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      favorites: [],
      plan: [],
      shoppingChecked: {},

      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null, favorites: [], plan: [], shoppingChecked: {} }),

      toggleFavorite: (item) => {
        const { favorites } = get();
        const found = favorites.find((f) => f.itemType === item.type && f.itemId === item.id);
        if (found) {
          set({ favorites: favorites.filter((f) => f.id !== found.id) });
          return;
        }
        set({
          favorites: [...favorites, { id: uid("fav"), itemType: item.type, itemId: item.id }],
        });
      },

      isFavorite: (item) => {
        return get().favorites.some((f) => f.itemType === item.type && f.itemId === item.id);
      },

      addToPlan: ({ item, dateISO, mealSlot, servings = 1 }) => {
        set({
          plan: [
            ...get().plan,
            { id: uid("plan"), dateISO, mealSlot, itemType: item.type, itemId: item.id, servings },
          ],
        });
      },

      removeFromPlan: (id) => set({ plan: get().plan.filter((p) => p.id !== id) }),

      setPlanItemServings: (id, servings) =>
        set({
          plan: get().plan.map((p) => (p.id === id ? { ...p, servings: Math.max(1, Math.round(servings)) } : p)),
        }),

      clearPlan: () => set({ plan: [], shoppingChecked: {} }),

      setShoppingChecked: (key, checked) =>
        set({ shoppingChecked: { ...get().shoppingChecked, [key]: checked } }),

      clearShoppingChecked: () => set({ shoppingChecked: {} }),
    }),
    {
      name: STORAGE_KEYS.state,
      version: 1,
      partialize: (state) => ({
        profile: state.profile,
        favorites: state.favorites,
        plan: state.plan,
        shoppingChecked: state.shoppingChecked,
      }),
    },
  ),
);

