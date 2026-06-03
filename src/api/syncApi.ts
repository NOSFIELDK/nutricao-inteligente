import { STORAGE_KEYS } from "@/storage/keys";
import type { AppBackup } from "@/storage/backup";

function getApiBase() {
  const saved = localStorage.getItem(STORAGE_KEYS.apiBase);
  if (saved) return saved.replace(/\/+$/g, "");
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
  return envBase.replace(/\/+$/g, "");
}

function join(base: string, path: string) {
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function apiPath(pathFromApiRoot: string) {
  const base = getApiBase();
  if (!base) return { base: "", path: pathFromApiRoot };
  const normalized = base.replace(/\/+$/g, "");
  if (normalized.toLowerCase().endsWith("/api")) {
    return { base: normalized.slice(0, -4), path: `/api${pathFromApiRoot}` };
  }
  return { base: normalized, path: `/api${pathFromApiRoot}` };
}

function authHeaders() {
  const token = localStorage.getItem(STORAGE_KEYS.authToken) ?? "";
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function hasRemoteApi() {
  return Boolean(getApiBase());
}

export async function register(params: { email: string; password: string }) {
  const { base, path } = apiPath("/auth/register");
  if (!base) throw new Error("API base não configurada.");
  const res = await fetch(join(base, path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "Falha ao registrar.");
  if (typeof data?.token === "string") localStorage.setItem(STORAGE_KEYS.authToken, data.token);
  return data as { ok: true; token: string; expiresAt: string };
}

export async function login(params: { email: string; password: string }) {
  const { base, path } = apiPath("/auth/login");
  if (!base) throw new Error("API base não configurada.");
  const res = await fetch(join(base, path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "Falha ao entrar.");
  if (typeof data?.token === "string") localStorage.setItem(STORAGE_KEYS.authToken, data.token);
  return data as { ok: true; token: string; expiresAt: string };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.authToken);
}

export async function me() {
  const { base, path } = apiPath("/auth/me");
  if (!base) throw new Error("API base não configurada.");
  const res = await fetch(join(base, path), {
    method: "GET",
    headers: { ...authHeaders() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "Falha ao carregar conta.");
  return data as { ok: true; email: string };
}

export async function pushBackup(backup: AppBackup) {
  const { base, path } = apiPath("/sync/push");
  if (!base) throw new Error("API base não configurada.");
  const res = await fetch(join(base, path), {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(backup),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "Falha ao enviar.");
  return data as { ok: true; updatedAt: string };
}

export async function pullBackup() {
  const { base, path } = apiPath("/sync/pull");
  if (!base) throw new Error("API base não configurada.");
  const res = await fetch(join(base, path), {
    method: "GET",
    headers: { ...authHeaders() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "Falha ao baixar.");
  const raw = data?.data as string | null | undefined;
  const backup = raw ? (JSON.parse(raw) as AppBackup) : null;
  return { ok: true as const, backup, updatedAt: data?.updatedAt as string | null };
}

