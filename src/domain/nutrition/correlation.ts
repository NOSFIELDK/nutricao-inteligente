import type { DailyCheckIn } from "@/domain/models";
import type { DailyPoint } from "@/domain/nutrition/series";

export type Correlation = {
  id: string;
  label: string;
  r: number;
  n: number;
  strength: "fraca" | "moderada" | "forte";
  text: string;
};

function pearson(pairs: Array<[number, number]>): number {
  const n = pairs.length;
  if (n < 3) return 0;
  let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of pairs) {
    sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y;
  }
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  if (den === 0) return 0;
  return num / den;
}

function strengthOf(r: number): Correlation["strength"] | null {
  const a = Math.abs(r);
  if (a < 0.3) return null;
  if (a < 0.5) return "fraca";
  if (a < 0.7) return "moderada";
  return "forte";
}

/**
 * Correlações simples (Pearson) entre sinais de check-in (sono/humor/fome) e
 * resultados (aderência ao plano / proteína). Não implica causalidade — é só
 * uma tendência observada nos últimos dias. Exige amostra mínima.
 */
export function computeCorrelations(params: {
  series: DailyPoint[];
  checkInByDate: Record<string, DailyCheckIn>;
  minSample?: number;
}): Correlation[] {
  const minSample = params.minSample ?? 5;
  const rows = params.series.map((p) => {
    const c = params.checkInByDate[p.dateISO];
    return {
      sleep: c?.sleepHours ?? null,
      mood: c?.mood ?? null,
      hunger: c?.hunger ?? null,
      adherence: p.adherence,
      proteinG: p.proteinG,
    };
  });

  const defs: Array<{ id: string; label: string; x: "sleep" | "mood" | "hunger"; y: "adherence" | "proteinG"; pos: string; neg: string }> = [
    { id: "sleep_adh", label: "Sono × Aderência", x: "sleep", y: "adherence", pos: "Noites mais dormidas andam junto com maior aderência ao plano.", neg: "Menos sono aparece junto com menor aderência ao plano." },
    { id: "sleep_prot", label: "Sono × Proteína", x: "sleep", y: "proteinG", pos: "Dormir mais parece acompanhar mais proteína no dia.", neg: "Menos sono aparece junto com menos proteína no dia." },
    { id: "mood_adh", label: "Humor × Aderência", x: "mood", y: "adherence", pos: "Humor melhor caminha junto com maior aderência.", neg: "Humor mais baixo aparece com menor aderência." },
    { id: "hunger_prot", label: "Fome × Proteína", x: "hunger", y: "proteinG", pos: "Mais fome aparece nos dias com mais proteína.", neg: "Mais fome aparece nos dias com menos proteína." },
  ];

  const out: Correlation[] = [];
  for (const d of defs) {
    const pairs = rows
      .filter((r) => r[d.x] != null && Number.isFinite(r[d.y]))
      .map((r) => [r[d.x] as number, r[d.y] as number] as [number, number]);
    if (pairs.length < minSample) continue;
    const r = pearson(pairs);
    const strength = strengthOf(r);
    if (!strength) continue;
    out.push({ id: d.id, label: d.label, r: Math.round(r * 100) / 100, n: pairs.length, strength, text: r >= 0 ? d.pos : d.neg });
  }

  return out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}
