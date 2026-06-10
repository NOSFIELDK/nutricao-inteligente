import type { CatalogItem, LabelScan, NutritionTargets, PlanItem, Recipe, UserProfile } from "@/domain/models";
import { buildTargets } from "@/domain/nutrition/targets";

export type Insight = {
  id: string;
  level: "baixo" | "medio" | "alto";
  title: string;
  detail: string;
  action: string;
};

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function recipeById(catalog: CatalogItem[], id: string) {
  return catalog.find((i) => i.type === "recipe" && i.id === id) as Recipe | undefined;
}

export function calcDayMacros(params: { catalog: CatalogItem[]; plan: PlanItem[]; dateISO: string }) {
  const items = params.plan.filter((p) => p.dateISO === params.dateISO);
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let fiberG = 0;

  for (const p of items) {
    if (p.itemType !== "recipe") continue;
    const r = recipeById(params.catalog, p.itemId);
    if (!r) continue;
    const mult = Math.max(0.5, p.servings);
    proteinG += r.proteinG * mult;
    carbsG += r.carbsG * mult;
    fatG += r.fatG * mult;
    fiberG += r.fiberG * mult;
  }

  return { proteinG: round(proteinG), carbsG: round(carbsG), fatG: round(fatG), fiberG: round(fiberG) };
}

export function buildInsights(params: {
  profile: UserProfile | null;
  catalog: CatalogItem[];
  plan: PlanItem[];
  dateISO: string;
  targetsOverride?: NutritionTargets | null;
  waterMl?: number;
  labelScans?: LabelScan[];
}): Insight[] {
  if (!params.profile) {
    return [
      {
        id: "no_profile",
        level: "medio",
        title: "Complete seu perfil",
        detail: "Sem perfil, os alertas ficam genéricos e menos úteis.",
        action: "Preencha idade, peso, objetivo e restrições.",
      },
    ];
  }

  const { proteinG, fiberG, carbsG } = calcDayMacros({ catalog: params.catalog, plan: params.plan, dateISO: params.dateISO });

  const targets = buildTargets(params.profile, params.targetsOverride ?? null);
  const proteinTarget = targets.proteinG;
  const fiberTarget = targets.fiberG;

  const insights: Insight[] = [];

  if (proteinG < proteinTarget * 0.75) {
    insights.push({
      id: "protein_low",
      level: "alto",
      title: "Proteína do dia parece baixa",
      detail: `Estimativa no plano: ${proteinG}g (meta aproximada: ${round(proteinTarget)}g).`,
      action: "Inclua uma receita proteica ou um lanche com proteína (ex.: iogurte sem lactose + castanhas).",
    });
  } else if (proteinG < proteinTarget) {
    insights.push({
      id: "protein_mid",
      level: "medio",
      title: "Você está perto da meta de proteína",
      detail: `Estimativa no plano: ${proteinG}g (meta aproximada: ${round(proteinTarget)}g).`,
      action: "Ajuste porções ou adicione uma fonte extra de proteína em uma refeição.",
    });
  }

  if (fiberG < Math.min(18, fiberTarget * 0.75)) {
    insights.push({
      id: "fiber_low",
      level: "medio",
      title: "Fibras podem melhorar",
      detail: `Estimativa no plano: ${fiberG}g (meta: ${round(fiberTarget)}g).`,
      action: "Aumente legumes/folhas e escolha opções integrais.",
    });
  }

  // Hidratação
  if (params.waterMl != null && targets.waterMl > 0) {
    const ratio = params.waterMl / targets.waterMl;
    if (ratio < 0.5) {
      insights.push({
        id: "water_low",
        level: "alto",
        title: "Hidratação baixa",
        detail: `Você registrou ${Math.round(params.waterMl)}ml (meta: ${targets.waterMl}ml).`,
        action: "Beba água ao longo do dia; tenha uma garrafa por perto e use os atalhos +250/+500ml.",
      });
    } else if (ratio < 0.8) {
      insights.push({
        id: "water_mid",
        level: "medio",
        title: "Falta um pouco de água",
        detail: `Você registrou ${Math.round(params.waterMl)}ml (meta: ${targets.waterMl}ml).`,
        action: "Mais alguns copos para fechar a meta do dia.",
      });
    }
  }

  // Rótulos do dia (sódio / açúcar)
  if (params.labelScans && params.labelScans.length > 0) {
    const totalSugar = params.labelScans.reduce((a, s) => a + (s.sugarG || 0), 0);
    const totalSodium = params.labelScans.reduce((a, s) => a + (s.sodiumMg || 0), 0);
    const sugaryItems = params.labelScans.filter((s) => s.sugarG >= 15);
    const saltyItems = params.labelScans.filter((s) => s.sodiumMg >= 400);

    if (sugaryItems.length > 0 || totalSugar >= 25) {
      insights.push({
        id: "label_sugar_high",
        level: "alto",
        title: "Açúcar alto em rótulos de hoje",
        detail: `Total registrado: ${round(totalSugar)}g${sugaryItems.length ? ` · destaque: ${sugaryItems.map((s) => s.product).slice(0, 2).join(", ")}` : ""}.`,
        action: "Prefira versões com menos açúcar e evite bebidas adoçadas; compare rótulos.",
      });
    }
    if (saltyItems.length > 0 || totalSodium >= 2000) {
      insights.push({
        id: "label_sodium_high",
        level: params.profile.conditions.includes("hipertensao") ? "alto" : "medio",
        title: "Sódio alto em rótulos de hoje",
        detail: `Total registrado: ${Math.round(totalSodium)}mg${saltyItems.length ? ` · destaque: ${saltyItems.map((s) => s.product).slice(0, 2).join(", ")}` : ""}.`,
        action: "Reduza ultraprocessados e embutidos; tempere com ervas no lugar do sal.",
      });
    }
  }

  if (params.profile.conditions.includes("hipertensao")) {
    const day = params.plan.filter((p) => p.dateISO === params.dateISO);
    const recipes = day
      .filter((p) => p.itemType === "recipe")
      .map((p) => recipeById(params.catalog, p.itemId))
      .filter((r): r is Recipe => !!r);
    const lowSodiumCount = recipes.filter((r) => r.tags.includes("lowSodium")).length;
    insights.push({
      id: "bp_hint",
      level: lowSodiumCount === 0 ? "medio" : "baixo",
      title: "Hipertensão: atenção ao sódio",
      detail: lowSodiumCount === 0 ? "Seu plano não tem destaque de baixo sódio hoje." : "Inclua mais opções com baixo sódio e hidratação adequada.",
      action: "Priorize preparos caseiros, temperos naturais e itens com tag de baixo sódio quando disponível.",
    });
  }

  if (params.profile.conditions.includes("diabetes")) {
    const highCarb = carbsG >= 180;
    const lowFiber = fiberG < fiberTarget;
    insights.push({
      id: "dm_hint",
      level: highCarb && lowFiber ? "medio" : "baixo",
      title: "Diabetes: priorize baixo IG",
      detail: highCarb && lowFiber ? "Carbo alto + fibra abaixo da meta pode aumentar picos." : "Fibras e combinações com proteína ajudam a reduzir picos.",
      action: "Prefira carbo de baixo IG, aumente fibras e combine carbo com proteína e vegetais.",
    });
  }

  if (params.profile.restrictions.includes("lactose") || params.profile.restrictions.includes("gluten")) {
    const day = params.plan.filter((p) => p.dateISO === params.dateISO);
    const recipes = day
      .filter((p) => p.itemType === "recipe")
      .map((p) => recipeById(params.catalog, p.itemId))
      .filter((r): r is Recipe => !!r);

    if (params.profile.restrictions.includes("lactose")) {
      const hasRisk = recipes.some((r) => !r.tags.includes("lactoseFree"));
      if (hasRisk) {
        insights.push({
          id: "lactose_attention",
          level: "medio",
          title: "Atenção à lactose",
          detail: "Algumas receitas do dia não estão marcadas como sem lactose.",
          action: "Revise ingredientes e prefira opções com tag sem lactose quando possível.",
        });
      }
    }

    if (params.profile.restrictions.includes("gluten")) {
      const hasRisk = recipes.some((r) => !r.tags.includes("glutenFree"));
      if (hasRisk) {
        insights.push({
          id: "gluten_attention",
          level: "medio",
          title: "Atenção ao glúten",
          detail: "Algumas receitas do dia não estão marcadas como sem glúten.",
          action: "Revise ingredientes e prefira opções com tag sem glúten quando possível.",
        });
      }
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "ok",
      level: "baixo",
      title: "Seu dia está bem equilibrado",
      detail: "Pelo plano atual, você está dentro de um perfil saudável de macros e fibras.",
      action: "Mantenha consistência e ajuste conforme energia e treino.",
    });
  }

  return insights;
}
