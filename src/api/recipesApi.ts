import type { Recipe } from "@/domain/models";
import { STORAGE_KEYS } from "@/storage/keys";

type SearchResponse = {
  source: string;
  mode?: "search" | "discover";
  seed?: string;
  page: number;
  pageSize: number;
  total: number;
  items: Recipe[];
};

function getApiBase() {
  const saved = localStorage.getItem(STORAGE_KEYS.apiBase);
  if (saved) return saved.replace(/\/+$/g, "");
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
  return envBase.replace(/\/+$/g, "");
}

function join(base: string, path: string) {
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function hasRemoteApi() {
  return Boolean(getApiBase());
}

export async function searchRemoteRecipes(params: { q: string; page: number; pageSize: number; seed?: string }) {
  const base = getApiBase();
  if (!base) throw new Error("API base não configurada.");
  const url = new URL(join(base, "/api/recipes/search"));
  url.searchParams.set("q", params.q);
  if (params.seed) url.searchParams.set("seed", params.seed);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("pageSize", String(params.pageSize));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Falha ao buscar receitas (${res.status})`);
  return (await res.json()) as SearchResponse;
}

export async function getRemoteRecipe(id: string) {
  const base = getApiBase();
  if (!base) throw new Error("API base não configurada.");
  const url = join(base, `/api/recipes/${encodeURIComponent(id)}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar receita (${res.status})`);
  return (await res.json()) as Recipe;
}
