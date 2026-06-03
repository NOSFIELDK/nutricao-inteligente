import type { NutritionTargets, UserProfile } from "@/domain/models";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function buildTargets(profile: UserProfile | null, override?: NutritionTargets | null): NutritionTargets {
  if (!profile) {
    const base = { proteinG: 0, fiberG: 25, waterMl: 2000 };
    return override ? { ...base, ...override } : base;
  }

  const proteinG =
    profile.primaryGoal === "performance"
      ? profile.weightKg * 1.6
      : profile.primaryGoal === "tratamento"
        ? profile.weightKg * 1.2
        : profile.weightKg * 1.0;

  const waterMl = profile.weightKg * 35;
  const base = { proteinG: round(proteinG), fiberG: 25, waterMl: Math.round(waterMl) };
  return override ? { ...base, ...override } : base;
}

