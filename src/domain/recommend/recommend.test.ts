import { describe, expect, it } from "vitest";

import { catalog } from "@/data/catalog";
import type { UserProfile } from "@/domain/models";
import { recommendCatalog } from "@/domain/recommend/recommend";

const baseProfile: UserProfile = {
  id: "u1",
  age: 30,
  sex: "outro",
  weightKg: 70,
  heightCm: 170,
  primaryGoal: "saude",
  dietaryPreferences: ["onivoro"],
  restrictions: [],
  conditions: [],
  activityLevel: "moderado",
};

describe("recommendCatalog", () => {
  it("filtra itens incompatíveis com restrição de lactose", () => {
    const profile: UserProfile = { ...baseProfile, restrictions: ["lactose"] };
    const recs = recommendCatalog(profile, catalog, 50);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.item.tags.includes("lactoseFree")).toBe(true);
    }
  });

  it("prioriza proteína quando objetivo é performance", () => {
    const profile: UserProfile = { ...baseProfile, primaryGoal: "performance" };
    const recs = recommendCatalog(profile, catalog, 20);
    const top = recs.slice(0, 5).map((r) => r.item.tags.includes("highProtein"));
    expect(top.filter(Boolean).length).toBeGreaterThanOrEqual(3);
  });
});

