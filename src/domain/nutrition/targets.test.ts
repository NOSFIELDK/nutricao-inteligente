import { describe, expect, it } from "vitest";

import type { NutritionTargets, UserProfile } from "@/domain/models";
import { buildTargets, computeEnergy } from "@/domain/nutrition/targets";

const baseProfile: UserProfile = {
  id: "u1",
  age: 30,
  sex: "m",
  weightKg: 80,
  heightCm: 180,
  primaryGoal: "performance",
  dietaryPreferences: ["onivoro"],
  restrictions: [],
  conditions: [],
  activityLevel: "moderado",
  goalIntent: "manutencao",
};

describe("computeEnergy (Mifflin-St Jeor)", () => {
  it("calcula TMB masculina conforme a fórmula", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    const { bmr } = computeEnergy(baseProfile);
    expect(bmr).toBe(1780);
  });

  it("usa a constante feminina (−161)", () => {
    const f: UserProfile = { ...baseProfile, sex: "f" };
    // 10*80 + 6.25*180 - 5*30 - 161 = 1614
    expect(computeEnergy(f).bmr).toBe(1614);
  });

  it("sexo 'outro' fica entre masculino e feminino", () => {
    const other = computeEnergy({ ...baseProfile, sex: "outro" }).bmr;
    const male = computeEnergy({ ...baseProfile, sex: "m" }).bmr;
    const female = computeEnergy({ ...baseProfile, sex: "f" }).bmr;
    expect(other).toBeGreaterThan(female);
    expect(other).toBeLessThan(male);
  });

  it("TDEE cresce com o nível de atividade", () => {
    const baixo = computeEnergy({ ...baseProfile, activityLevel: "baixo" }).tdee;
    const moderado = computeEnergy({ ...baseProfile, activityLevel: "moderado" }).tdee;
    const alto = computeEnergy({ ...baseProfile, activityLevel: "alto" }).tdee;
    expect(baixo).toBeLessThan(moderado);
    expect(moderado).toBeLessThan(alto);
  });
});

describe("buildTargets", () => {
  it("retorna metas seguras sem perfil", () => {
    const t = buildTargets(null);
    expect(t.proteinG).toBe(0);
    expect(t.caloriesKcal).toBeGreaterThan(0);
  });

  it("retorna metas seguras com peso inválido", () => {
    const t = buildTargets({ ...baseProfile, weightKg: 0 });
    expect(t.caloriesKcal).toBe(2000);
  });

  it("preenche todos os macros para um perfil válido", () => {
    const t = buildTargets(baseProfile);
    expect(t.caloriesKcal).toBeGreaterThan(0);
    expect(t.proteinG).toBeGreaterThan(0);
    expect(t.carbsG).toBeGreaterThan(0);
    expect(t.fatG).toBeGreaterThan(0);
    expect(t.fiberG).toBeGreaterThanOrEqual(25);
    expect(t.waterMl).toBeGreaterThan(0);
  });

  it("a soma dos macros reconstrói as calorias (±5 kcal)", () => {
    const t = buildTargets(baseProfile);
    const kcal = t.proteinG * 4 + (t.carbsG ?? 0) * 4 + (t.fatG ?? 0) * 9;
    expect(Math.abs(kcal - (t.caloriesKcal ?? 0))).toBeLessThanOrEqual(5);
  });

  it("cutting < manutenção < bulking em calorias", () => {
    const cut = buildTargets({ ...baseProfile, goalIntent: "cutting" }).caloriesKcal ?? 0;
    const man = buildTargets({ ...baseProfile, goalIntent: "manutencao" }).caloriesKcal ?? 0;
    const bulk = buildTargets({ ...baseProfile, goalIntent: "bulking" }).caloriesKcal ?? 0;
    expect(cut).toBeLessThan(man);
    expect(man).toBeLessThan(bulk);
  });

  it("cutting aumenta a proteína por kg (2.0 g/kg)", () => {
    const t = buildTargets({ ...baseProfile, goalIntent: "cutting" });
    expect(t.proteinG).toBeCloseTo(80 * 2.0, 1);
  });

  it("manutenção + performance usa 1.6 g/kg de proteína", () => {
    const t = buildTargets(baseProfile);
    expect(t.proteinG).toBeCloseTo(80 * 1.6, 1);
  });

  it("assume 'manutencao' quando goalIntent está ausente (retrocompat)", () => {
    const { goalIntent: _omit, ...legacy } = baseProfile;
    const t = buildTargets(legacy as UserProfile);
    const man = buildTargets({ ...baseProfile, goalIntent: "manutencao" });
    expect(t.caloriesKcal).toBe(man.caloriesKcal);
  });

  it("override manual vence o cálculo", () => {
    const override: NutritionTargets = { proteinG: 999, fiberG: 50, waterMl: 4000 };
    const t = buildTargets(baseProfile, override);
    expect(t.proteinG).toBe(999);
    expect(t.fiberG).toBe(50);
    expect(t.waterMl).toBe(4000);
    // campos não sobrescritos continuam calculados
    expect(t.caloriesKcal).toBeGreaterThan(0);
  });

  it("hidratação maior para atividade alta", () => {
    const baixo = buildTargets({ ...baseProfile, activityLevel: "baixo" }).waterMl;
    const alto = buildTargets({ ...baseProfile, activityLevel: "alto" }).waterMl;
    expect(alto).toBeGreaterThan(baixo);
  });
});
