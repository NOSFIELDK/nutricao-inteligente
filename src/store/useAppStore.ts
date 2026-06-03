import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AppReminder, CatalogItem, Favorite, FontScale, ManualEntry, MealSlot, NutritionTargets, PlanItem, Recipe, ReminderInterval, UserProfile } from "@/domain/models";
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
  manualByDate: Record<string, ManualEntry[]>;
  customTargets: NutritionTargets | null;
  highContrast: boolean;
  fontScale: FontScale;

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

  addManualEntry: (params: Omit<ManualEntry, "id">) => void;
  removeManualEntry: (dateISO: string, id: string) => void;

  setCustomTargets: (targets: NutritionTargets) => void;
  clearCustomTargets: () => void;

  setHighContrast: (enabled: boolean) => void;
  setFontScale: (scale: FontScale) => void;

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
      manualByDate: {},
      customTargets: null,
      highContrast: false,
      fontScale: "100",

      setProfile: (profile) => set({ profile }),
      clearProfile: () =>
        set({
          profile: null,
          favorites: [],
          plan: [],
          shoppingChecked: {},
          recipeCache: {},
          consumedPlan: {},
          waterByDate: {},
          manualByDate: {},
          customTargets: null,
        }),

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

      addManualEntry: (params) => {
        const entry: ManualEntry = {
          id: uid("man"),
          dateISO: params.dateISO,
          title: params.title,
          proteinG: Math.max(0, Number(params.proteinG) || 0),
          carbsG: Math.max(0, Number(params.carbsG) || 0),
          fatG: Math.max(0, Number(params.fatG) || 0),
          fiberG: Math.max(0, Number(params.fiberG) || 0),
        };
        const current = get().manualByDate[params.dateISO] ?? [];
        set({ manualByDate: { ...get().manualByDate, [params.dateISO]: [entry, ...current] } });
      },

      removeManualEntry: (dateISO, id) => {
        const current = get().manualByDate[dateISO] ?? [];
        const next = current.filter((e) => e.id !== id);
        const map = { ...get().manualByDate, [dateISO]: next };
        if (next.length === 0) delete map[dateISO];
        set({ manualByDate: map });
      },

      setCustomTargets: (targets) =>
        set({
          customTargets: {
            proteinG: Math.max(0, Number(targets.proteinG) || 0),
            fiberG: Math.max(0, Number(targets.fiberG) || 0),
            waterMl: Math.max(0, Math.round(Number(targets.waterMl) || 0)),
          },
        }),

      clearCustomTargets: () => set({ customTargets: null }),

      setHighContrast: (enabled) => set({ highContrast: enabled }),

      setFontScale: (scale) => set({ fontScale: scale }),

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
      version: 5,
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
          manualByDate: version < 5 ? {} : state.manualByDate ?? {},
          customTargets: version < 5 ? null : state.customTargets ?? null,
          highContrast: version < 5 ? false : state.highContrast ?? false,
          fontScale: version < 5 ? "100" : state.fontScale ?? "100",
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
        manualByDate: state.manualByDate,
        customTargets: state.customTargets,
        highContrast: state.highContrast,
        fontScale: state.fontScale,
      }),
    },
  ),
);
