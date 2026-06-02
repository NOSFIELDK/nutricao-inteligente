import type { CatalogItem, PlanItem, Recipe } from "@/domain/models";

export type ShoppingItem = {
  key: string;
  label: string;
  count: number;
};

function normalizeIngredient(s: string) {
  return s
    .toLowerCase()
    .replace(/^\s*[\d/.,]+\s*/g, "")
    .replace(/\b(g|kg|ml|l|xícara|xícaras|colher|colheres|punhado)\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\s*de\s+/g, "")
    .trim();
}

function recipeById(catalog: CatalogItem[], id: string) {
  return catalog.find((i) => i.type === "recipe" && i.id === id) as Recipe | undefined;
}

export function buildShoppingList(params: { catalog: CatalogItem[]; plan: PlanItem[]; startISO: string; endISO: string }) {
  const start = new Date(params.startISO);
  const end = new Date(params.endISO);

  const items = params.plan.filter((p) => {
    const d = new Date(p.dateISO);
    return d >= start && d <= end;
  });

  const map = new Map<string, ShoppingItem>();

  for (const p of items) {
    if (p.itemType !== "recipe") continue;
    const r = recipeById(params.catalog, p.itemId);
    if (!r) continue;

    for (const ingredient of r.ingredients) {
      const normalized = normalizeIngredient(ingredient);
      if (!normalized) continue;
      const prev = map.get(normalized);
      map.set(normalized, {
        key: normalized,
        label: normalized,
        count: (prev?.count ?? 0) + 1,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
