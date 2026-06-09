import { describe, expect, it } from "vitest";

import type { CatalogItem, PlanItem, Recipe } from "@/domain/models";
import { buildDailySeries } from "@/domain/nutrition/series";

const recipe: Recipe = {
  id: "r1",
  type: "recipe",
  title: "Frango com batata",
  imageUrl: "",
  category: "performance",
  tags: ["highProtein"],
  prepMinutes: 20,
  servings: 1,
  ingredients: [],
  steps: [],
  proteinG: 30,
  carbsG: 40,
  fatG: 10,
  fiberG: 5,
};

const catalog: CatalogItem[] = [recipe];

const plan: PlanItem[] = [
  { id: "p1", dateISO: "2026-06-08", mealSlot: "almoco", itemType: "recipe", itemId: "r1", servings: 1 },
  { id: "p2", dateISO: "2026-06-08", mealSlot: "jantar", itemType: "recipe", itemId: "r1", servings: 1 },
  { id: "p3", dateISO: "2026-06-07", mealSlot: "almoco", itemType: "recipe", itemId: "r1", servings: 1 },
];

describe("buildDailySeries", () => {
  const base = {
    catalog,
    plan,
    manualByDate: {},
    waterByDate: { "2026-06-08": 1500 },
    weightByDate: { "2026-06-07": 80 },
    endISO: "2026-06-08",
    days: 3,
  };

  it("retorna pontos do mais antigo ao mais recente", () => {
    const s = buildDailySeries({ ...base, consumedPlan: {} });
    expect(s).toHaveLength(3);
    expect(s[0].dateISO).toBe("2026-06-06");
    expect(s[2].dateISO).toBe("2026-06-08");
  });

  it("conta apenas itens marcados como consumidos nas macros", () => {
    const s = buildDailySeries({ ...base, consumedPlan: { p1: true } });
    const day8 = s[2];
    // só p1 consumido => 1 receita
    expect(day8.proteinG).toBe(30);
    expect(day8.caloriesKcal).toBe(30 * 4 + 40 * 4 + 10 * 9);
  });

  it("calcula aderência consumido/planejado", () => {
    const s = buildDailySeries({ ...base, consumedPlan: { p1: true } });
    const day8 = s[2];
    expect(day8.planned).toBe(2);
    expect(day8.consumed).toBe(1);
    expect(day8.adherence).toBeCloseTo(0.5, 5);
  });

  it("aderência é 0 em dia sem plano", () => {
    const s = buildDailySeries({ ...base, consumedPlan: {} });
    expect(s[0].planned).toBe(0);
    expect(s[0].adherence).toBe(0);
  });

  it("inclui água e peso quando registrados, senão null/0", () => {
    const s = buildDailySeries({ ...base, consumedPlan: {} });
    expect(s[2].waterMl).toBe(1500);
    expect(s[1].weightKg).toBe(80);
    expect(s[0].weightKg).toBeNull();
    expect(s[0].waterMl).toBe(0);
  });

  it("soma registros manuais às macros do plano", () => {
    const s = buildDailySeries({
      ...base,
      consumedPlan: { p1: true },
      manualByDate: { "2026-06-08": [{ id: "m1", dateISO: "2026-06-08", title: "Whey", proteinG: 25, carbsG: 3, fatG: 1, fiberG: 0 }] },
    });
    expect(s[2].proteinG).toBe(55); // 30 + 25
  });
});
