import { STORAGE_KEYS } from "@/storage/keys";

export type AppBackup = {
  version: 1;
  createdAtISO: string;
  theme: string | null;
  state: string | null;
};

export function createBackup(): AppBackup {
  return {
    version: 1,
    createdAtISO: new Date().toISOString(),
    theme: localStorage.getItem(STORAGE_KEYS.theme),
    state: localStorage.getItem(STORAGE_KEYS.state),
  };
}

export function restoreBackup(raw: unknown) {
  const data = raw as Partial<AppBackup>;
  if (data.version !== 1) throw new Error("Backup incompatível.");

  if (typeof data.theme === "string") localStorage.setItem(STORAGE_KEYS.theme, data.theme);
  if (typeof data.state === "string") localStorage.setItem(STORAGE_KEYS.state, data.state);
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEYS.state);
}
