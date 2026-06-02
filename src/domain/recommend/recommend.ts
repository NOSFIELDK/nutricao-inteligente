import type { CatalogItem, CatalogTag, Recommendation, RecommendationReason, UserProfile } from "@/domain/models";

type GoalContext = {
  goal: UserProfile["primaryGoal"];
  conditions: UserProfile["conditions"];
};

const reasonLabels: Record<CatalogTag, string> = {
  highProtein: "mais proteína",
  highFiber: "mais fibras",
  lowGI: "baixo índice glicêmico",
  lowSodium: "baixo sódio",
  lactoseFree: "sem lactose",
  glutenFree: "sem glúten",
  vegan: "vegano",
  vegetarian: "vegetariano",
  lowCarb: "low carb",
  preWorkout: "bom pré-treino",
  postWorkout: "bom pós-treino",
  energy: "energia",
  hydration: "hidratação",
  ironRich: "rico em ferro",
  calciumRich: "rico em cálcio",
};

function hasTag(item: CatalogItem, tag: CatalogTag) {
  return item.tags?.includes(tag) ?? false;
}

function preferenceAllows(profile: UserProfile, item: CatalogItem) {
  const prefs = new Set(profile.dietaryPreferences);
  if (prefs.has("vegano")) return hasTag(item, "vegan");
  if (prefs.has("vegetariano")) return hasTag(item, "vegetarian") || hasTag(item, "vegan");
  return true;
}

function restrictionAllows(profile: UserProfile, item: CatalogItem) {
  const restrictions = new Set(profile.restrictions);
  if (restrictions.has("lactose") && !hasTag(item, "lactoseFree")) return false;
  if (restrictions.has("gluten") && !hasTag(item, "glutenFree")) return false;
  return true;
}

function scoreForContext(item: CatalogItem, ctx: GoalContext) {
  let score = 0;
  const reasons: RecommendationReason[] = [];

  const push = (tag: CatalogTag, value: number) => {
    if (!hasTag(item, tag)) return;
    score += value;
    reasons.push({ tag, label: reasonLabels[tag] });
  };

  if (ctx.goal === "saude") {
    push("highFiber", 3);
    push("lowSodium", 1);
    push("ironRich", 1);
    push("hydration", 1);
    push("highProtein", 1);
  }

  if (ctx.goal === "tratamento") {
    push("highFiber", 3);
    push("lowGI", 3);
    push("lowSodium", 2);
    push("ironRich", 1);
    push("highProtein", 1);
  }

  if (ctx.goal === "performance") {
    push("highProtein", 4);
    push("postWorkout", 2);
    push("preWorkout", 2);
    push("energy", 1);
    push("lowCarb", 1);
    push("hydration", 1);
  }

  if (ctx.conditions.includes("diabetes")) {
    push("lowGI", 3);
    push("highFiber", 2);
  }

  if (ctx.conditions.includes("hipertensao")) {
    push("lowSodium", 3);
  }

  return { score, reasons };
}

export function recommendCatalog(profile: UserProfile, catalog: CatalogItem[], limit = 12): Recommendation[] {
  const allowed = catalog.filter((item) => restrictionAllows(profile, item) && preferenceAllows(profile, item));
  const ctx: GoalContext = { goal: profile.primaryGoal, conditions: profile.conditions };

  const scored: Recommendation[] = allowed
    .map((item) => {
      const { score, reasons } = scoreForContext(item, ctx);
      const base = score;
      const dietBonus =
        (hasTag(item, "lactoseFree") ? 0.2 : 0) +
        (hasTag(item, "glutenFree") ? 0.2 : 0) +
        (hasTag(item, "vegan") ? 0.15 : 0) +
        (hasTag(item, "vegetarian") ? 0.1 : 0);

      const finalScore = base + dietBonus;
      const uniqReasons = reasons
        .filter((r, idx) => reasons.findIndex((x) => x.tag === r.tag) === idx)
        .slice(0, 3);

      return { item, score: finalScore, reasons: uniqReasons };
    })
    .filter((r) => r.score > 0.5)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

