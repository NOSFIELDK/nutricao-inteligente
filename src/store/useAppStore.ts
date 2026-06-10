import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AppReminder,
  CatalogItem,
  DailyCheckIn,
  Favorite,
  FontScale,
  LabelScan,
  ManualEntry,
  MealSlot,
  NutritionTargets,
  PlanItem,
  Recipe,
  ReminderInterval,
  UserProfile,
} from "@/domain/models";
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
  weightByDate: Record<string, number>;
  manualByDate: Record<string, ManualEntry[]>;
  checkInByDate: Record<string, DailyCheckIn>;
  labelScansByDate: Record<string, LabelScan[]>;
  customTargets: NutritionTargets | null;
  highContrast: boolean;
  fontScale: FontScale;
  mascotStyle: "crafted" | "blocky";
  mascotSize: "sm" | "md" | "lg";
  mascotItem: "axe" | "shield";
  syncDirty: Partial<Record<"profile" | "plan" | "tracking" | "prefs", boolean>>;
  syncLastSyncedAt: Partial<Record<"profile" | "plan" | "tracking" | "prefs", string>>;

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
  setWeight: (dateISO: string, weightKg: number | null) => void;

  addManualEntry: (params: Omit<ManualEntry, "id">) => void;
  removeManualEntry: (dateISO: string, id: string) => void;

  setCheckIn: (dateISO: string, patch: Partial<Omit<DailyCheckIn, "dateISO">>) => void;
  addLabelScan: (params: Omit<LabelScan, "id">) => void;
  removeLabelScan: (dateISO: string, id: string) => void;

  setCustomTargets: (targets: NutritionTargets) => void;
  clearCustomTargets: () => void;

  setHighContrast: (enabled: boolean) => void;
  setFontScale: (scale: FontScale) => void;
  setMascotStyle: (style: "crafted" | "blocky") => void;
  setMascotSize: (size: "sm" | "md" | "lg") => void;
  setMascotItem: (item: "axe" | "shield") => void;

  setReminderEnabled: (id: string, enabled: boolean) => void;
  setReminderInterval: (id: string, interval: ReminderInterval) => void;
  addReminder: (label: string, message: string, intervalMinutes: ReminderInterval) => void;
  removeReminder: (id: string) => void;

  markSynced: (key: "profile" | "plan" | "tracking" | "prefs", updatedAt: string) => void;
  applyRemote: (key: "profile" | "plan" | "tracking" | "prefs", data: unknown, updatedAt: string) => void;
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
      weightByDate: {},
      manualByDate: {},
      checkInByDate: {},
      labelScansByDate: {},
      customTargets: null,
      highContrast: false,
      fontScale: "100",
      mascotStyle: "crafted",
      mascotSize: "md",
      mascotItem: "axe",
      syncDirty: {},
      syncLastSyncedAt: {},

      setProfile: (profile) => set((s) => ({ profile, syncDirty: { ...s.syncDirty, profile: true } })),
      clearProfile: () =>
        set({
          profile: null,
          favorites: [],
          plan: [],
          shoppingChecked: {},
          recipeCache: {},
          consumedPlan: {},
          waterByDate: {},
          weightByDate: {},
          manualByDate: {},
          checkInByDate: {},
          labelScansByDate: {},
          customTargets: null,
          syncDirty: { profile: true, plan: true, tracking: true, prefs: true },
        }),

      toggleFavorite: (item) => {
        const { favorites } = get();
        const found = favorites.find((f) => f.itemType === item.type && f.itemId === item.id);
        if (found) {
          set((s) => ({
            favorites: favorites.filter((f) => f.id !== found.id),
            syncDirty: { ...s.syncDirty, profile: true },
          }));
          return;
        }
        if (item.type === "recipe") {
          set((s) => ({ recipeCache: { ...s.recipeCache, [item.id]: item }, syncDirty: { ...s.syncDirty, plan: true } }));
        }
        set((s) => ({
          favorites: [...favorites, { id: uid("fav"), itemType: item.type, itemId: item.id }],
          syncDirty: { ...s.syncDirty, profile: true },
        }));
      },

      isFavorite: (item) => {
        return get().favorites.some((f) => f.itemType === item.type && f.itemId === item.id);
      },

      addToPlan: ({ item, dateISO, mealSlot, servings = 1 }) => {
        if (item.type === "recipe") {
          set((s) => ({ recipeCache: { ...s.recipeCache, [item.id]: item }, syncDirty: { ...s.syncDirty, plan: true } }));
        }
        set((s) => ({
          plan: [...s.plan, { id: uid("plan"), dateISO, mealSlot, itemType: item.type, itemId: item.id, servings }],
          syncDirty: { ...s.syncDirty, plan: true },
        }));
      },

      removeFromPlan: (id) =>
        set((s) => ({
          plan: s.plan.filter((p) => p.id !== id),
          consumedPlan: Object.fromEntries(Object.entries(s.consumedPlan).filter(([k]) => k !== id)),
          syncDirty: { ...s.syncDirty, plan: true },
        })),

      setPlanItemServings: (id, servings) =>
        set((s) => ({
          plan: s.plan.map((p) => (p.id === id ? { ...p, servings: Math.max(1, Math.round(servings)) } : p)),
          syncDirty: { ...s.syncDirty, plan: true },
        })),

      clearPlan: () => set((s) => ({ plan: [], shoppingChecked: {}, consumedPlan: {}, syncDirty: { ...s.syncDirty, plan: true } })),

      setShoppingChecked: (key, checked) =>
        set((s) => ({ shoppingChecked: { ...s.shoppingChecked, [key]: checked }, syncDirty: { ...s.syncDirty, plan: true } })),

      clearShoppingChecked: () => set((s) => ({ shoppingChecked: {}, syncDirty: { ...s.syncDirty, plan: true } })),

      cacheRecipes: (recipes) => {
        if (recipes.length === 0) return;
        const next = { ...get().recipeCache };
        for (const r of recipes) next[r.id] = r;
        set((s) => ({ recipeCache: next, syncDirty: { ...s.syncDirty, plan: true } }));
      },

      toggleConsumed: (planItemId) =>
        set((s) => ({
          consumedPlan: { ...s.consumedPlan, [planItemId]: !s.consumedPlan[planItemId] },
          syncDirty: { ...s.syncDirty, plan: true },
        })),

      setWater: (dateISO, waterMl) =>
        set((s) => ({
          waterByDate: { ...s.waterByDate, [dateISO]: Math.max(0, Math.round(waterMl)) },
          syncDirty: { ...s.syncDirty, tracking: true },
        })),

      addWater: (dateISO, deltaMl) => {
        const current = get().waterByDate[dateISO] ?? 0;
        set((s) => ({
          waterByDate: { ...s.waterByDate, [dateISO]: Math.max(0, Math.round(current + deltaMl)) },
          syncDirty: { ...s.syncDirty, tracking: true },
        }));
      },

      setWeight: (dateISO, weightKg) => {
        const map = { ...get().weightByDate };
        if (weightKg == null || !Number.isFinite(weightKg) || weightKg <= 0) {
          delete map[dateISO];
        } else {
          map[dateISO] = Math.round(Math.min(400, Math.max(20, weightKg)) * 10) / 10;
        }
        set((s) => ({ weightByDate: map, syncDirty: { ...s.syncDirty, tracking: true } }));
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
        set((s) => ({
          manualByDate: { ...s.manualByDate, [params.dateISO]: [entry, ...current] },
          syncDirty: { ...s.syncDirty, tracking: true },
        }));
      },

      removeManualEntry: (dateISO, id) => {
        const current = get().manualByDate[dateISO] ?? [];
        const next = current.filter((e) => e.id !== id);
        const map = { ...get().manualByDate, [dateISO]: next };
        if (next.length === 0) delete map[dateISO];
        set((s) => ({ manualByDate: map, syncDirty: { ...s.syncDirty, tracking: true } }));
      },

      setCheckIn: (dateISO, patch) => {
        const current = get().checkInByDate[dateISO] ?? { dateISO, sleepHours: null, mood: null, hunger: null, training: false, notes: "" };
        const next: DailyCheckIn = { ...current, ...patch, dateISO };
        set((s) => ({ checkInByDate: { ...s.checkInByDate, [dateISO]: next }, syncDirty: { ...s.syncDirty, tracking: true } }));
      },

      addLabelScan: (params) => {
        const entry: LabelScan = { ...params, id: uid("lbl") };
        const current = get().labelScansByDate[params.dateISO] ?? [];
        set((s) => ({
          labelScansByDate: { ...s.labelScansByDate, [params.dateISO]: [entry, ...current] },
          syncDirty: { ...s.syncDirty, tracking: true },
        }));
      },

      removeLabelScan: (dateISO, id) => {
        const current = get().labelScansByDate[dateISO] ?? [];
        const next = current.filter((e) => e.id !== id);
        const map = { ...get().labelScansByDate, [dateISO]: next };
        if (next.length === 0) delete map[dateISO];
        set((s) => ({ labelScansByDate: map, syncDirty: { ...s.syncDirty, tracking: true } }));
      },

      setCustomTargets: (targets) =>
        set((s) => ({
          customTargets: {
            proteinG: Math.max(0, Number(targets.proteinG) || 0),
            fiberG: Math.max(0, Number(targets.fiberG) || 0),
            waterMl: Math.max(0, Math.round(Number(targets.waterMl) || 0)),
          },
          syncDirty: { ...s.syncDirty, profile: true },
        })),

      clearCustomTargets: () => set((s) => ({ customTargets: null, syncDirty: { ...s.syncDirty, profile: true } })),

      setHighContrast: (enabled) => set((s) => ({ highContrast: enabled, syncDirty: { ...s.syncDirty, prefs: true } })),

      setFontScale: (scale) => set((s) => ({ fontScale: scale, syncDirty: { ...s.syncDirty, prefs: true } })),
      setMascotStyle: (style) => set((s) => ({ mascotStyle: style, syncDirty: { ...s.syncDirty, prefs: true } })),
      setMascotSize: (size) => set((s) => ({ mascotSize: size, syncDirty: { ...s.syncDirty, prefs: true } })),
      setMascotItem: (item) => set((s) => ({ mascotItem: item, syncDirty: { ...s.syncDirty, prefs: true } })),

      setReminderEnabled: (id, enabled) =>
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, enabled } : r)),
          syncDirty: { ...s.syncDirty, prefs: true },
        })),

      setReminderInterval: (id, intervalMinutes) =>
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, intervalMinutes } : r)),
          syncDirty: { ...s.syncDirty, prefs: true },
        })),

      addReminder: (label, message, intervalMinutes) =>
        set((s) => ({
          reminders: [...s.reminders, { id: uid("rem"), label, message, intervalMinutes, enabled: true }],
          syncDirty: { ...s.syncDirty, prefs: true },
        })),

      removeReminder: (id) =>
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id), syncDirty: { ...s.syncDirty, prefs: true } })),

      markSynced: (key, updatedAt) => set((s) => ({ syncDirty: { ...s.syncDirty, [key]: false }, syncLastSyncedAt: { ...s.syncLastSyncedAt, [key]: updatedAt } })),

      applyRemote: (key, data, updatedAt) => {
        if (key === "profile") {
          const d = data as Partial<Pick<AppState, "profile" | "favorites" | "customTargets">>;
          set((s) => ({
            profile: d.profile ?? s.profile,
            favorites: d.favorites ?? s.favorites,
            customTargets: d.customTargets ?? s.customTargets,
            syncDirty: { ...s.syncDirty, profile: false },
            syncLastSyncedAt: { ...s.syncLastSyncedAt, profile: updatedAt },
          }));
          return;
        }
        if (key === "plan") {
          const d = data as Partial<Pick<AppState, "plan" | "consumedPlan" | "shoppingChecked" | "recipeCache">>;
          set((s) => ({
            plan: d.plan ?? s.plan,
            consumedPlan: d.consumedPlan ?? s.consumedPlan,
            shoppingChecked: d.shoppingChecked ?? s.shoppingChecked,
            recipeCache: d.recipeCache ?? s.recipeCache,
            syncDirty: { ...s.syncDirty, plan: false },
            syncLastSyncedAt: { ...s.syncLastSyncedAt, plan: updatedAt },
          }));
          return;
        }
        if (key === "tracking") {
          const d = data as Partial<Pick<AppState, "waterByDate" | "weightByDate" | "manualByDate" | "checkInByDate" | "labelScansByDate">>;
          set((s) => ({
            waterByDate: d.waterByDate ?? s.waterByDate,
            weightByDate: d.weightByDate ?? s.weightByDate,
            manualByDate: d.manualByDate ?? s.manualByDate,
            checkInByDate: d.checkInByDate ?? s.checkInByDate,
            labelScansByDate: d.labelScansByDate ?? s.labelScansByDate,
            syncDirty: { ...s.syncDirty, tracking: false },
            syncLastSyncedAt: { ...s.syncLastSyncedAt, tracking: updatedAt },
          }));
          return;
        }
        const d = data as Partial<Pick<AppState, "reminders" | "highContrast" | "fontScale" | "mascotStyle" | "mascotSize" | "mascotItem">>;
        set((s) => ({
          reminders: d.reminders ?? s.reminders,
          highContrast: typeof d.highContrast === "boolean" ? d.highContrast : s.highContrast,
          fontScale: d.fontScale ?? s.fontScale,
          mascotStyle: d.mascotStyle ?? s.mascotStyle,
          mascotSize: d.mascotSize ?? s.mascotSize,
          mascotItem: d.mascotItem ?? s.mascotItem,
          syncDirty: { ...s.syncDirty, prefs: false },
          syncLastSyncedAt: { ...s.syncLastSyncedAt, prefs: updatedAt },
        }));
      },
    }),
    {
      name: STORAGE_KEYS.state,
      version: 10,
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
          weightByDate: version < 8 ? {} : state.weightByDate ?? {},
          manualByDate: version < 5 ? {} : state.manualByDate ?? {},
          checkInByDate: version < 7 ? {} : state.checkInByDate ?? {},
          labelScansByDate: version < 7 ? {} : state.labelScansByDate ?? {},
          customTargets: version < 5 ? null : state.customTargets ?? null,
          highContrast: version < 5 ? false : state.highContrast ?? false,
          fontScale: version < 5 ? "100" : state.fontScale ?? "100",
          mascotStyle: version < 9 ? "crafted" : state.mascotStyle ?? "crafted",
          mascotSize: version < 9 ? "md" : state.mascotSize ?? "md",
          mascotItem: version < 10 ? "axe" : state.mascotItem ?? "axe",
          syncDirty: version < 6 ? {} : state.syncDirty ?? {},
          syncLastSyncedAt: version < 6 ? {} : state.syncLastSyncedAt ?? {},
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
        weightByDate: state.weightByDate,
        manualByDate: state.manualByDate,
        checkInByDate: state.checkInByDate,
        labelScansByDate: state.labelScansByDate,
        customTargets: state.customTargets,
        highContrast: state.highContrast,
        fontScale: state.fontScale,
        mascotStyle: state.mascotStyle,
        mascotSize: state.mascotSize,
        mascotItem: state.mascotItem,
        syncDirty: state.syncDirty,
        syncLastSyncedAt: state.syncLastSyncedAt,
      }),
    },
  ),
);
