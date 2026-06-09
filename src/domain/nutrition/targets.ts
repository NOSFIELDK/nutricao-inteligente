import type { ActivityLevel, GoalIntent, NutritionTargets, UserProfile } from "@/domain/models";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

/** Metas usadas quando ainda não há perfil. */
const FALLBACK_TARGETS: NutritionTargets = {
  proteinG: 0,
  fiberG: 25,
  waterMl: 2000,
  caloriesKcal: 2000,
  carbsG: 250,
  fatG: 67,
};

/** Multiplicador de atividade aplicado à TMB para estimar o TDEE. */
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  baixo: 1.375,
  moderado: 1.55,
  alto: 1.725,
};

/** Ajuste calórico sobre o TDEE conforme a intenção de objetivo. */
const GOAL_FACTOR: Record<GoalIntent, number> = {
  cutting: 0.82, // déficit ~18%
  manutencao: 1.0,
  bulking: 1.12, // superávit ~12%
};

function activityFactor(level: ActivityLevel) {
  return ACTIVITY_FACTOR[level] ?? ACTIVITY_FACTOR.moderado;
}

function goalIntentOf(profile: UserProfile): GoalIntent {
  return profile.goalIntent ?? "manutencao";
}

/** Proteína em g/kg: prioriza a intenção calórica, depois o objetivo temático. */
function proteinPerKg(profile: UserProfile): number {
  const intent = goalIntentOf(profile);
  if (intent === "cutting") return 2.0; // preserva massa em déficit
  if (intent === "bulking") return 1.8;
  // manutenção: pondera pelo objetivo temático
  if (profile.primaryGoal === "performance") return 1.6;
  if (profile.primaryGoal === "tratamento") return 1.4;
  return 1.6;
}

/**
 * Taxa Metabólica Basal (Mifflin-St Jeor) e TDEE.
 * Para sexo "outro", usa a média das constantes masculina (+5) e feminina (−161).
 */
export function computeEnergy(profile: UserProfile): { bmr: number; tdee: number } {
  const sexConstant = profile.sex === "m" ? 5 : profile.sex === "f" ? -161 : -78;
  const bmrRaw = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexConstant;
  const bmr = Math.max(0, bmrRaw);
  const tdee = bmr * activityFactor(profile.activityLevel);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

/**
 * Calcula metas de nutrição a partir do perfil.
 *
 * Fluxo: TMB (Mifflin-St Jeor) → TDEE (fator de atividade) → ajuste por objetivo
 * (cutting/manutenção/bulking) → distribuição de macros (proteína g/kg, gordura
 * ~25–30% das kcal, restante em carbo) → fibra (14 g / 1000 kcal, mínimo 25 g)
 * → água (35 ml/kg + ajuste por atividade).
 *
 * `override` permite metas manuais; os campos presentes vencem o cálculo.
 * Retrocompatível: perfil incompleto/ausente cai em valores seguros.
 */
export function buildTargets(profile: UserProfile | null, override?: NutritionTargets | null): NutritionTargets {
  if (!profile || !Number.isFinite(profile.weightKg) || profile.weightKg <= 0) {
    return override ? { ...FALLBACK_TARGETS, ...override } : FALLBACK_TARGETS;
  }

  const { tdee } = computeEnergy(profile);
  const intent = goalIntentOf(profile);
  const caloriesKcal = Math.round(tdee * (GOAL_FACTOR[intent] ?? 1));

  const proteinG = profile.weightKg * proteinPerKg(profile);
  const fatPct = intent === "cutting" ? 0.25 : 0.3;
  const fatG = (caloriesKcal * fatPct) / 9;

  const carbKcal = caloriesKcal - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, carbKcal / 4);

  const fiberG = Math.max(25, round((caloriesKcal / 1000) * 14));

  const waterBonus = profile.activityLevel === "alto" ? 500 : profile.activityLevel === "moderado" ? 250 : 0;
  const waterMl = Math.round(profile.weightKg * 35 + waterBonus);

  const base: NutritionTargets = {
    proteinG: round(proteinG),
    fiberG,
    waterMl,
    caloriesKcal,
    carbsG: round(carbsG),
    fatG: round(fatG),
  };

  return override ? { ...base, ...override } : base;
}
