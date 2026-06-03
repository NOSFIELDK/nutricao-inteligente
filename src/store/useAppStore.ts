import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AppReminder, CatalogItem, Favorite, MealSlot, PlanItem, Recipe, ReminderInterval, UserProfile } from "@/domain/models";
import { STORAGE_KEYS } from "@/storage/keys";
import { uid } from "@/utils/id";

const DEFAULT_REMINDERS: AppReminder[] = [
  { id: "water", label: "Beber água", message: "Hora de beber água! Mantenha-se hidratado.", intervalMinutes: 60, enabled: false },
  { id: "snack", label: "Lanche saudável", message: "Hora do lanche! Que tal uma fruta ou castanhas?", intervalMinutes: 180, enabled: false },
  { id: "stretch", label: "Alongar", message: "Pausa para alongar! Cuide do seu corpo.", intervalMinutes: 90, enabled: false },
];

type AppState = {
  profile: UserProfile | null;
  favorites: Favorite[];
  plan: PlanItem[];
  shoppingChecked: Record<string, boolean>;
  reminders: AppReminder[];
  recipeCache: Record<string, Recipe>;
  consumedPlan: Record<string, boolean>;
  waterByDate: Record<string, number>;

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

  cacheRecipes: (recipes: Recipe[]) => void;

  toggleConsumed: (planItemId: string) => void;
  setWater: (dateISO: string, waterMl: number) => void;
  addWater: (dateISO: string, deltaMl: number) => void;

  setReminderEnabled: (id: string, enabled: boolean) => void;
  setReminderInterval: (id: string, interval: ReminderInterval) => void;
  addReminder: (label: string, message: string, intervalMinutes: ReminderInterval) => void;
  removeReminder: (id: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      favorites: [],
      plan: [],
      shoppingChecked: {},
      reminders: DEFAULT_REMINDERS,
      recipeCache: {},
      consumedPlan: {},
      waterByDate: {},

      setProfile: (profile) => set({ profile }),
      clearProfile: () =>
        set({ profile: null, favorites: [], plan: [], shoppingChecked: {}, recipeCache: {}, consumedPlan: {}, waterByDate: {} }),

      toggleFavorite: (item) => {
        const { favorites } = get();
        const found = favorites.find((f) => f.itemType === item.type && f.itemId === item.id);
        if (found) {
          set({ favorites: favorites.filter((f) => f.id !== found.id) });
          return;
        }
        if (item.type === "recipe") {
          set({ recipeCache: { ...get().recipeCache, [item.id]: item } });
        }
        set({
          favorites: [...favorites, { id: uid("fav"), itemType: item.type, itemId: item.id }],
        });
      },

      isFavorite: (item) => {
        return get().favorites.some((f) => f.itemType === item.type && f.itemId === item.id);
      },

      addToPlan: ({ item, dateISO, mealSlot, servings = 1 }) => {
        if (item.type === "recipe") {
          set({ recipeCache: { ...get().recipeCache, [item.id]: item } });
        }
        set({
          plan: [
            ...get().plan,
            { id: uid("plan"), dateISO, mealSlot, itemType: item.type, itemId: item.id, servings },
          ],
        });
      },

      removeFromPlan: (id) =>
        set({
          plan: get().plan.filter((p) => p.id !== id),
          consumedPlan: Object.fromEntries(Object.entries(get().consumedPlan).filter(([k]) => k !== id)),
        }),

      setPlanItemServings: (id, servings) =>
        set({
          plan: get().plan.map((p) => (p.id === id ? { ...p, servings: Math.max(1, Math.round(servings)) } : p)),
        }),

      clearPlan: () => set({ plan: [], shoppingChecked: {}, consumedPlan: {} }),

      setShoppingChecked: (key, checked) =>
        set({ shoppingChecked: { ...get().shoppingChecked, [key]: checked } }),

      clearShoppingChecked: () => set({ shoppingChecked: {} }),

      cacheRecipes: (recipes) => {
        if (recipes.length === 0) return;
        const next = { ...get().recipeCache };
        for (const r of recipes) next[r.id] = r;
        set({ recipeCache: next });
      },

      toggleConsumed: (planItemId) =>
        set({
          consumedPlan: { ...get().consumedPlan, [planItemId]: !get().consumedPlan[planItemId] },
        }),

      setWater: (dateISO, waterMl) => set({ waterByDate: { ...get().waterByDate, [dateISO]: Math.max(0, Math.round(waterMl)) } }),

      addWater: (dateISO, deltaMl) => {
        const current = get().waterByDate[dateISO] ?? 0;
        set({ waterByDate: { ...get().waterByDate, [dateISO]: Math.max(0, Math.round(current + deltaMl)) } });
      },

      setReminderEnabled: (id, enabled) =>
        set({ reminders: get().reminders.map((r) => (r.id === id ? { ...r, enabled } : r)) }),

      setReminderInterval: (id, intervalMinutes) =>
        set({ reminders: get().reminders.map((r) => (r.id === id ? { ...r, intervalMinutes } : r)) }),

      addReminder: (label, message, intervalMinutes) =>
        set({ reminders: [...get().reminders, { id: uid("rem"), label, message, intervalMinutes, enabled: true }] }),

      removeReminder: (id) =>
        set({ reminders: get().reminders.filter((r) => r.id !== id) }),
    }),
    {
      name: STORAGE_KEYS.state,
      version: 4,
      migrate: (persisted: unknown, version) => {
        const state = persisted as Partial<AppState>;
        return {
          profile: state.profile ?? null,
          favorites: state.favorites ?? [],
          plan: state.plan ?? [],
          shoppingChecked: state.shoppingChecked ?? {},
          reminders: version < 2 ? DEFAULT_REMINDERS : state.reminders ?? DEFAULT_REMINDERS,
          recipeCache: version < 3 ? {} : state.recipeCache ?? {},
          consumedPlan: version < 4 ? {} : state.consumedPlan ?? {},
          waterByDate: version < 4 ? {} : state.waterByDate ?? {},
        };
      },
      partialize: (state) => ({
        profile: state.profile,
        favorites: state.favorites,
        plan: state.plan,
        shoppingChecked: state.shoppingChecked,
        reminders: state.reminders,
        recipeCache: state.recipeCache,
        consumedPlan: state.consumedPlan,
        waterByDate: state.waterByDate,
      }),
    },
  ),
);
