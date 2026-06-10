import type { CatalogItem, PlanItem, Recipe } from "@/domain/models";

export type IngredientCategory = "hortifruti" | "proteina" | "laticinios" | "graos" | "temperos" | "outros";

export type ShoppingItem = {
  key: string;
  label: string;
  count: number;
  category: IngredientCategory;
};

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  hortifruti: "Hortifrúti",
  proteina: "Proteínas",
  laticinios: "Laticínios",
  graos: "Grãos & cereais",
  temperos: "Temperos & molhos",
  outros: "Outros",
};

export const CATEGORY_ORDER: IngredientCategory[] = ["hortifruti", "proteina", "laticinios", "graos", "temperos", "outros"];

const CATEGORY_KEYWORDS: Record<Exclude<IngredientCategory, "outros">, string[]> = {
  // proteína vem primeiro para classificar feijão/grão-de-bico como proteína
  proteina: ["frango", "carne", "peixe", "salmão", "salmao", "atum", "ovo", "ovos", "peito", "filé", "file", "camarão", "camarao", "tofu", "grão de bico", "grao de bico", "lentilha", "feijão", "feijao", "whey", "peru", "tilápia", "tilapia", "sardinha", "patinho", "moída", "moida"],
  laticinios: ["leite", "queijo", "iogurte", "requeijão", "requeijao", "manteiga", "creme de leite", "ricota", "cottage", "nata", "mussarela", "muçarela", "coalhada"],
  hortifruti: ["alface", "tomate", "cebola", "alho", "cenoura", "brócolis", "brocolis", "espinafre", "banana", "maçã", "maca", "abacate", "batata", "abobrinha", "pimentão", "pimentao", "couve", "rúcula", "rucula", "pepino", "manga", "morango", "laranja", "fruta", "legume", "verdura", "salsa", "cebolinha", "gengibre", "cogumelo", "champignon", "limão", "limao", "beterraba", "mandioca", "vagem", "berinjela"],
  graos: ["arroz", "aveia", "quinoa", "macarrão", "macarrao", "pão", "pao", "farinha", "trigo", "granola", "cuscuz", "tapioca", "cereal", "massa", "grão", "grao", "centeio", "milho"],
  temperos: ["sal", "pimenta", "azeite", "óleo", "oleo", "vinagre", "açúcar", "acucar", "mel", "molho", "shoyu", "mostarda", "orégano", "oregano", "manjericão", "manjericao", "cominho", "páprica", "paprica", "canela", "tempero", "ervas", "curry"],
};

export function categorizeIngredient(label: string): IngredientCategory {
  const s = label.toLowerCase();
  for (const cat of ["proteina", "laticinios", "hortifruti", "graos", "temperos"] as const) {
    if (CATEGORY_KEYWORDS[cat].some((k) => s.includes(k))) return cat;
  }
  return "outros";
}

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
        category: prev?.category ?? categorizeIngredient(normalized),
      });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
