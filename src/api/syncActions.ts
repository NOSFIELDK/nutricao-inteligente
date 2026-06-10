import * as SyncApi from "@/api/syncApi";
import type { SyncV2Key } from "@/api/syncApi";
import { STORAGE_KEYS } from "@/storage/keys";
import { useAppStore } from "@/store/useAppStore";

export function syncConfigured() {
  const api = (localStorage.getItem(STORAGE_KEYS.apiBase) ?? "").trim();
  const token = (localStorage.getItem(STORAGE_KEYS.authToken) ?? "").trim();
  return Boolean(api && token);
}

/** Monta o payload de cada chave de sync a partir do estado atual. */
export function buildSyncItems(state: ReturnType<typeof useAppStore.getState>): Record<SyncV2Key, unknown> {
  return {
    profile: { profile: state.profile, favorites: state.favorites, customTargets: state.customTargets },
    plan: {
      plan: state.plan,
      consumedPlan: state.consumedPlan,
      shoppingChecked: state.shoppingChecked,
      recipeCache: state.recipeCache,
    },
    tracking: {
      waterByDate: state.waterByDate,
      weightByDate: state.weightByDate,
      manualByDate: state.manualByDate,
      checkInByDate: state.checkInByDate,
      labelScansByDate: state.labelScansByDate,
    },
    prefs: {
      reminders: state.reminders,
      highContrast: state.highContrast,
      fontScale: state.fontScale,
      mascotStyle: state.mascotStyle,
      mascotSize: state.mascotSize,
      mascotItem: state.mascotItem,
    },
  };
}

/** Envia tudo que está pendente e baixa o que houver de mais novo. */
export async function forceSync(): Promise<{ pushedKeys: SyncV2Key[]; appliedKeys: SyncV2Key[] }> {
  if (!syncConfigured()) throw new Error("Conecte uma conta e configure a API para sincronizar.");

  const store = useAppStore.getState();
  const dirtyKeys = (Object.keys(store.syncDirty) as SyncV2Key[]).filter((k) => store.syncDirty[k]);
  const pushedKeys: SyncV2Key[] = [];

  if (dirtyKeys.length > 0) {
    const all = buildSyncItems(store);
    const items: Partial<Record<SyncV2Key, unknown>> = {};
    dirtyKeys.forEach((k) => {
      items[k] = all[k];
    });
    const res = await SyncApi.pushItems(items);
    (Object.keys(res.updatedAt ?? {}) as SyncV2Key[]).forEach((k) => {
      const ts = res.updatedAt[k];
      if (ts) {
        useAppStore.getState().markSynced(k, ts);
        pushedKeys.push(k);
      }
    });
  }

  const appliedKeys: SyncV2Key[] = [];
  const pull = await SyncApi.pullItems();
  if (pull?.items) {
    const st = useAppStore.getState();
    (Object.keys(pull.items) as SyncV2Key[]).forEach((k) => {
      const item = pull.items[k];
      if (!item?.updatedAt) return;
      const localLast = st.syncLastSyncedAt[k] ?? "";
      if (localLast && item.updatedAt <= localLast) return;
      if (st.syncDirty[k]) return;
      useAppStore.getState().applyRemote(k, item.data, item.updatedAt);
      appliedKeys.push(k);
    });
  }

  return { pushedKeys, appliedKeys };
}
