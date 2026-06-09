import type { CatalogItem, ManualEntry, PlanItem } from "@/domain/models";
import { calcDayMacros } from "@/domain/nutrition/insights";
import { addDaysISO } from "@/utils/date";

export type DailyPoint = {
  dateISO: string;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  caloriesKcal: number;
  waterMl: number;
  weightKg: number | null;
  planned: number;
  consumed: number;
  /** Fração consumido/planejado no dia (0–1); 0 quando não há itens planejados. */
  adherence: number;
};

function round(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Constrói a série diária (mais antigo → mais recente) dos últimos `days` dias
 * terminando em `endISO`. Reúne macros consumidas (itens do plano marcados como
 * consumidos + registros manuais), água, peso e aderência.
 */
export function buildDailySeries(params: {
  catalog: CatalogItem[];
  plan: PlanItem[];
  consumedPlan: Record<string, boolean>;
  manualByDate: Record<string, ManualEntry[]>;
  waterByDate: Record<string, number>;
  weightByDate: Record<string, number>;
  endISO: string;
  days: number;
}): DailyPoint[] {
  const points: DailyPoint[] = [];

  for (let i = params.days - 1; i >= 0; i--) {
    const dateISO = addDaysISO(params.endISO, -i);
    const dayPlan = params.plan.filter((p) => p.dateISO === dateISO);
    const consumedItems = dayPlan.filter((p) => params.consumedPlan[p.id]);

    const m = calcDayMacros({ catalog: params.catalog, plan: consumedItems, dateISO });
    const manual = (params.manualByDate[dateISO] ?? []).reduce(
      (acc, e) => ({
        proteinG: acc.proteinG + e.proteinG,
        carbsG: acc.carbsG + e.carbsG,
        fatG: acc.fatG + e.fatG,
        fiberG: acc.fiberG + e.fiberG,
      }),
      { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );

    const proteinG = round(m.proteinG + manual.proteinG);
    const carbsG = round(m.carbsG + manual.carbsG);
    const fatG = round(m.fatG + manual.fatG);
    const fiberG = round(m.fiberG + manual.fiberG);
    const planned = dayPlan.length;
    const consumed = consumedItems.length;

    points.push({
      dateISO,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      caloriesKcal: Math.round(proteinG * 4 + carbsG * 4 + fatG * 9),
      waterMl: params.waterByDate[dateISO] ?? 0,
      weightKg: params.weightByDate[dateISO] ?? null,
      planned,
      consumed,
      adherence: planned > 0 ? consumed / planned : 0,
    });
  }

  return points;
}
