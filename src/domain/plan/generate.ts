import type { CatalogItem, MealSlot, NutritionTargets, Recipe, UserProfile } from "@/domain/models";
import { recommendCatalog } from "@/domain/recommend/recommend";

export type GeneratedSlotItem = { dateISO: string; mealSlot: MealSlot; recipeId: string };

const FILL_SLOTS: MealSlot[] = ["almoco", "jantar"];

function calOf(r: Recipe) {
  return r.proteinG * 4 + r.carbsG * 4 + r.fatG * 9;
}

function rankedRecipes(profile: UserProfile, catalog: CatalogItem[]): Recipe[] {
  return recommendCatalog(profile, catalog, 60)
    .filter((r) => r.item.type === "recipe")
    .map((r) => r.item as Recipe);
}

function pickForSlots(params: {
  recipes: Recipe[];
  slots: MealSlot[];
  dateISO: string;
  perMealProtein: number;
  perMealCal: number;
  avoidIds: Set<string>;
  avoidPenalty: number;
}): GeneratedSlotItem[] {
  const { recipes, slots, dateISO, perMealProtein, perMealCal, avoidIds, avoidPenalty } = params;
  const usedToday = new Set<string>();
  const out: GeneratedSlotItem[] = [];
  for (const slot of slots) {
    const ranked = recipes
      .filter((r) => !usedToday.has(r.id))
      .map((r, idx) => {
        const protDist = Math.abs(r.proteinG - perMealProtein);
        const calDist = Math.abs(calOf(r) - perMealCal) * 0.05;
        const penalty = avoidIds.has(r.id) ? avoidPenalty : 0;
        const recOrder = idx * 0.02; // mantém um pouco da ordem de recomendação
        return { r, cost: protDist + calDist + penalty + recOrder };
      })
      .sort((a, b) => a.cost - b.cost);
    const pick = ranked[0]?.r;
    if (!pick) continue;
    usedToday.add(pick.id);
    out.push({ dateISO, mealSlot: slot, recipeId: pick.id });
  }
  return out;
}

function perMeal(targets: NutritionTargets, n: number) {
  const protein = targets.proteinG / n;
  const cal = (targets.caloriesKcal || targets.proteinG * 20) / n;
  return { protein, cal };
}

/**
 * Gera a semana aproximando proteína/calorias da meta diária (divididas por
 * refeição) e evitando repetir a mesma receita em dias consecutivos.
 */
export function generateWeekPlan(params: {
  profile: UserProfile;
  catalog: CatalogItem[];
  targets: NutritionTargets;
  dates: string[];
  slots?: MealSlot[];
}): GeneratedSlotItem[] {
  const slots = params.slots ?? FILL_SLOTS;
  const recipes = rankedRecipes(params.profile, params.catalog);
  if (recipes.length === 0) return [];
  const { protein, cal } = perMeal(params.targets, slots.length);

  const out: GeneratedSlotItem[] = [];
  let prevDayIds = new Set<string>();
  for (const dateISO of params.dates) {
    const day = pickForSlots({ recipes, slots, dateISO, perMealProtein: protein, perMealCal: cal, avoidIds: prevDayIds, avoidPenalty: 12 });
    out.push(...day);
    prevDayIds = new Set(day.map((d) => d.recipeId));
  }
  return out;
}

/** Regenera um único dia, evitando repetir os ids informados. */
export function generateDayPlan(params: {
  profile: UserProfile;
  catalog: CatalogItem[];
  targets: NutritionTargets;
  dateISO: string;
  slots?: MealSlot[];
  avoidIds?: string[];
}): GeneratedSlotItem[] {
  const slots = params.slots ?? FILL_SLOTS;
  const recipes = rankedRecipes(params.profile, params.catalog);
  if (recipes.length === 0) return [];
  const { protein, cal } = perMeal(params.targets, slots.length);
  return pickForSlots({
    recipes,
    slots,
    dateISO: params.dateISO,
    perMealProtein: protein,
    perMealCal: cal,
    avoidIds: new Set(params.avoidIds ?? []),
    avoidPenalty: 10,
  });
}
