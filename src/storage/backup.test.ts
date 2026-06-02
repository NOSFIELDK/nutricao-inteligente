import { describe, expect, it, beforeEach } from "vitest";

import { createBackup, resetAll, restoreBackup } from "@/storage/backup";
import { STORAGE_KEYS } from "@/storage/keys";

function installLocalStorage() {
  const map = new Map<string, string>();
  const api = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => void map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  };
  (globalThis as unknown as { localStorage: typeof api }).localStorage = api;
  return api;
}

describe("backup", () => {
  beforeEach(() => {
    const ls = installLocalStorage();
    ls.clear();
  });

  it("exporta e restaura o estado", () => {
    localStorage.setItem(STORAGE_KEYS.theme, "dark");
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify({ any: "data" }));
    localStorage.setItem(STORAGE_KEYS.apiBase, "https://example.workers.dev");

    const b = createBackup();
    expect(b.version).toBe(2);
    expect(b.theme).toBe("dark");
    expect(b.state).toBe(JSON.stringify({ any: "data" }));
    expect(b.apiBase).toBe("https://example.workers.dev");

    resetAll();
    expect(localStorage.getItem(STORAGE_KEYS.state)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.apiBase)).toBeNull();

    restoreBackup(b);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEYS.state)).toBe(JSON.stringify({ any: "data" }));
    expect(localStorage.getItem(STORAGE_KEYS.apiBase)).toBe("https://example.workers.dev");
  });
});
