import type { CatalogItem, PlanItem, Recipe, UserProfile } from "@/domain/models";

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

  const { proteinG, fiberG } = calcDayMacros({ catalog: params.catalog, plan: params.plan, dateISO: params.dateISO });

  const proteinTarget =
    params.profile.primaryGoal === "performance"
      ? params.profile.weightKg * 1.6
      : params.profile.primaryGoal === "tratamento"
        ? params.profile.weightKg * 1.2
        : params.profile.weightKg * 1.0;

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

  if (fiberG < 18) {
    insights.push({
      id: "fiber_low",
      level: "medio",
      title: "Fibras podem melhorar",
      detail: `Estimativa no plano: ${fiberG}g (alvo comum: 25g).`,
      action: "Aumente legumes/folhas e escolha opções integrais.",
    });
  }

  if (params.profile.conditions.includes("hipertensao")) {
    insights.push({
      id: "bp_hint",
      level: "baixo",
      title: "Hipertensão: atenção ao sódio",
      detail: "Prefira temperos naturais e minimize ultraprocessados.",
      action: "Busque tags de baixo sódio e mantenha boa hidratação.",
    });
  }

  if (params.profile.conditions.includes("diabetes")) {
    insights.push({
      id: "dm_hint",
      level: "baixo",
      title: "Diabetes: priorize baixo IG",
      detail: "Fibras e combinações com proteína ajudam a reduzir picos.",
      action: "Use tags de baixo índice glicêmico e monte pratos com volume de vegetais.",
    });
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

