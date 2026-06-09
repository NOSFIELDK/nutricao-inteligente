import * as React from "react";

import * as SyncApi from "@/api/syncApi";
import { STORAGE_KEYS } from "@/storage/keys";
import { useAppStore } from "@/store/useAppStore";

type Key = SyncApi.SyncV2Key;

function getApiBase() {
  return (localStorage.getItem(STORAGE_KEYS.apiBase) ?? "").trim();
}

function hasToken() {
  return Boolean((localStorage.getItem(STORAGE_KEYS.authToken) ?? "").trim());
}

function buildItems(state: ReturnType<typeof useAppStore.getState>): Record<Key, unknown> {
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
    prefs: { reminders: state.reminders, highContrast: state.highContrast, fontScale: state.fontScale },
  };
}

export function SyncManager() {
  const syncDirty = useAppStore((s) => s.syncDirty);
  const syncLastSyncedAt = useAppStore((s) => s.syncLastSyncedAt);
  const markSynced = useAppStore((s) => s.markSynced);
  const applyRemote = useAppStore((s) => s.applyRemote);

  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const api = getApiBase();
    if (!api || !hasToken()) {
      setReady(false);
      return;
    }
    setReady(true);
  }, [syncDirty.profile, syncDirty.plan, syncDirty.tracking, syncDirty.prefs]);

  React.useEffect(() => {
    if (!ready) return;

    let stopped = false;
    let pushTimer: number | null = null;
    let pulling = false;
    let pushing = false;

    const pullOnce = async () => {
      if (pulling || pushing) return;
      pulling = true;
      try {
        const res = await SyncApi.pullItems();
        if (!res?.items) return;
        const state = useAppStore.getState();
        (Object.keys(res.items) as Key[]).forEach((k) => {
          const item = res.items[k];
          if (!item?.updatedAt) return;
          const localLast = state.syncLastSyncedAt[k] ?? "";
          if (localLast && item.updatedAt <= localLast) return;
          if (state.syncDirty[k]) return;
          applyRemote(k, item.data, item.updatedAt);
        });
      } catch {
      } finally {
        pulling = false;
      }
    };

    const pushOnce = async () => {
      if (pushing || pulling) return;
      const state = useAppStore.getState();
      const dirtyKeys = (Object.keys(state.syncDirty) as Key[]).filter((k) => state.syncDirty[k]);
      if (dirtyKeys.length === 0) return;
      pushing = true;
      try {
        const allItems = buildItems(state);
        const items: Partial<Record<Key, unknown>> = {};
        dirtyKeys.forEach((k) => {
          items[k] = allItems[k];
        });
        const res = await SyncApi.pushItems(items);
        (Object.keys(res.updatedAt ?? {}) as Key[]).forEach((k) => {
          const ts = res.updatedAt[k];
          if (ts) markSynced(k, ts);
        });
      } catch {
      } finally {
        pushing = false;
      }
    };

    const schedulePush = () => {
      if (pushTimer) window.clearTimeout(pushTimer);
      pushTimer = window.setTimeout(() => {
        pushOnce();
      }, 1500);
    };

    let prevDirty = useAppStore.getState().syncDirty;
    const unsub = useAppStore.subscribe((state) => {
      const next = state.syncDirty;
      if (next === prevDirty) return;
      prevDirty = next;
      const any = Boolean(next.profile || next.plan || next.tracking || next.prefs);
      if (any) schedulePush();
    });

    pullOnce();
    const pullInterval = window.setInterval(() => {
      if (!stopped) pullOnce();
    }, 5 * 60 * 1000);

    return () => {
      stopped = true;
      unsub();
      window.clearInterval(pullInterval);
      if (pushTimer) window.clearTimeout(pushTimer);
    };
  }, [applyRemote, markSynced, ready, syncLastSyncedAt.prefs, syncLastSyncedAt.plan, syncLastSyncedAt.profile, syncLastSyncedAt.tracking]);

  return null;
}
