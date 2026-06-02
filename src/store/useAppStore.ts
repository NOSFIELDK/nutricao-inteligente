import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AppReminder, CatalogItem, Favorite, MealSlot, PlanItem, ReminderInterval, UserProfile } from "@/domain/models";
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
      version: 2,
      migrate: (persisted: unknown, version) => {
        const state = persisted as Partial<AppState>;
        return {
          profile: state.profile ?? null,
          favorites: state.favorites ?? [],
          plan: state.plan ?? [],
          shoppingChecked: state.shoppingChecked ?? {},
          reminders: version < 2 ? DEFAULT_REMINDERS : state.reminders ?? DEFAULT_REMINDERS,
        };
      },
      partialize: (state) => ({
        profile: state.profile,
        favorites: state.favorites,
        plan: state.plan,
        shoppingChecked: state.shoppingChecked,
        reminders: state.reminders,
      }),
    },
  ),
);
