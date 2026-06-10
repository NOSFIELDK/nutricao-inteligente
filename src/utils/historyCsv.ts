import type { CatalogItem, DailyCheckIn, ManualEntry, PlanItem } from "@/domain/models";
import { calcDayMacros } from "@/domain/nutrition/insights";
import { addDaysISO } from "@/utils/date";

/**
 * Gera o CSV do histórico (peso/água/macros/check-in) dos últimos `days` dias
 * terminando em `endISO` (mais antigo → mais recente).
 */
export function buildHistoryCsv(params: {
  catalog: CatalogItem[];
  plan: PlanItem[];
  consumedPlan: Record<string, boolean>;
  manualByDate: Record<string, ManualEntry[]>;
  waterByDate: Record<string, number>;
  weightByDate: Record<string, number>;
  checkInByDate: Record<string, DailyCheckIn>;
  endISO: string;
  days: number;
}): string {
  const header = [
    "dateISO",
    "proteinG",
    "carbsG",
    "fatG",
    "fiberG",
    "waterMl",
    "weightKg",
    "sleepHours",
    "mood",
    "hunger",
    "training",
    "consumedPlanItems",
    "planItems",
    "manualEntries",
  ].join(",");

  const dates = Array.from({ length: params.days }).map((_, i) => addDaysISO(params.endISO, -(params.days - 1 - i)));

  const rows = dates.map((d) => {
    const dayPlan = params.plan.filter((p) => p.dateISO === d);
    const dayConsumed = dayPlan.filter((p) => params.consumedPlan[p.id]);
    const m = calcDayMacros({ catalog: params.catalog, plan: dayConsumed, dateISO: d });
    const manual = (params.manualByDate[d] ?? []).reduce(
      (acc, e) => ({
        proteinG: acc.proteinG + e.proteinG,
        carbsG: acc.carbsG + e.carbsG,
        fatG: acc.fatG + e.fatG,
        fiberG: acc.fiberG + e.fiberG,
      }),
      { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );
    const r1 = (n: number) => Math.round(n * 10) / 10;
    const c = params.checkInByDate[d];
    return [
      d,
      r1(m.proteinG + manual.proteinG),
      r1(m.carbsG + manual.carbsG),
      r1(m.fatG + manual.fatG),
      r1(m.fiberG + manual.fiberG),
      params.waterByDate[d] ?? 0,
      params.weightByDate[d] ?? "",
      c?.sleepHours ?? "",
      c?.mood ?? "",
      c?.hunger ?? "",
      c?.training ? 1 : 0,
      dayConsumed.length,
      dayPlan.length,
      (params.manualByDate[d] ?? []).length,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
