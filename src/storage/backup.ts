import { STORAGE_KEYS } from "@/storage/keys";

export type AppBackup = {
  version: 1 | 2;
  createdAtISO: string;
  theme: string | null;
  state: string | null;
  apiBase: string | null;
};

export function createBackup(): AppBackup {
  return {
    version: 2,
    createdAtISO: new Date().toISOString(),
    theme: localStorage.getItem(STORAGE_KEYS.theme),
    state: localStorage.getItem(STORAGE_KEYS.state),
    apiBase: localStorage.getItem(STORAGE_KEYS.apiBase),
  };
}

export function restoreBackup(raw: unknown) {
  const data = raw as Partial<AppBackup>;
  if (data.version !== 1 && data.version !== 2) throw new Error("Backup incompatível.");

  if (typeof data.theme === "string") localStorage.setItem(STORAGE_KEYS.theme, data.theme);
  if (typeof data.state === "string") localStorage.setItem(STORAGE_KEYS.state, data.state);
  if (typeof data.apiBase === "string") localStorage.setItem(STORAGE_KEYS.apiBase, data.apiBase);
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEYS.state);
  localStorage.removeItem(STORAGE_KEYS.apiBase);
  localStorage.removeItem(STORAGE_KEYS.authToken);
}
