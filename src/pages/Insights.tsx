import * as React from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Chip";
import { LeifSays } from "@/components/LeifSays";
import { catalog } from "@/data/catalog";
import { buildInsights, calcDayMacros } from "@/domain/nutrition/insights";
import { buildTargets } from "@/domain/nutrition/targets";
import { useAppStore } from "@/store/useAppStore";
import { todayISO } from "@/utils/date";

function levelTone(level: "baixo" | "medio" | "alto") {
  if (level === "alto") return "accent2" as const;
  if (level === "medio") return "accent" as const;
  return "muted" as const;
}

export default function InsightsPage() {
  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const recipeCache = useAppStore((s) => s.recipeCache);
  const consumedPlan = useAppStore((s) => s.consumedPlan);
  const manualByDate = useAppStore((s) => s.manualByDate);
  const waterByDate = useAppStore((s) => s.waterByDate);
  const labelScansByDate = useAppStore((s) => s.labelScansByDate);
  const customTargets = useAppStore((s) => s.customTargets);

  const dateISO = todayISO();
  const mergedCatalog = React.useMemo(() => [...catalog, ...Object.values(recipeCache)], [recipeCache]);
  const consumedTodayPlan = React.useMemo(() => plan.filter((p) => p.dateISO === dateISO).filter((p) => consumedPlan[p.id]), [consumedPlan, dateISO, plan]);
  const targets = React.useMemo(() => buildTargets(profile, customTargets), [customTargets, profile]);
  const insights = React.useMemo(
    () =>
      buildInsights({
        profile,
        catalog: mergedCatalog,
        plan: consumedTodayPlan,
        dateISO,
        targetsOverride: customTargets,
        waterMl: waterByDate[dateISO] ?? 0,
        labelScans: labelScansByDate[dateISO] ?? [],
      }),
    [profile, mergedCatalog, consumedTodayPlan, dateISO, customTargets, waterByDate, labelScansByDate],
  );
  const macros = React.useMemo(() => {
    const m = calcDayMacros({ catalog: mergedCatalog, plan: consumedTodayPlan, dateISO });
    const manual = (manualByDate[dateISO] ?? []).reduce(
      (acc, e) => ({
        proteinG: acc.proteinG + e.proteinG,
        carbsG: acc.carbsG + e.carbsG,
        fatG: acc.fatG + e.fatG,
        fiberG: acc.fiberG + e.fiberG,
      }),
      { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );
    return {
      proteinG: Math.round((m.proteinG + manual.proteinG) * 10) / 10,
      carbsG: Math.round((m.carbsG + manual.carbsG) * 10) / 10,
      fatG: Math.round((m.fatG + manual.fatG) * 10) / 10,
      fiberG: Math.round((m.fiberG + manual.fiberG) * 10) / 10,
    };
  }, [consumedTodayPlan, mergedCatalog, dateISO, manualByDate]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight text-fg">Runas</div>
          <div className="mt-1 text-sm text-muted">As runas revelam os segredos nutricionais de hoje ({dateISO}).</div>
        </div>
        {!profile ? (
          <Link to="/perfil" className="text-sm font-medium text-accent">
            Criar perfil
          </Link>
        ) : null}
      </div>

      {!profile ? (
        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp animate-fade-up">
          <LeifSays
            mood="motivate"
            message="As runas só falam para quem tem um perfil forjado. Crie o seu para revelar os segredos nutricionais do dia."
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        {(
          [
            { label: "Proteína", value: macros.proteinG, unit: "g", target: targets.proteinG || 50, color: "bg-accent" },
            { label: "Carbo",    value: macros.carbsG,   unit: "g", target: 250, color: "bg-accent-2" },
            { label: "Gordura",  value: macros.fatG,     unit: "g", target: 70,  color: "bg-accent/70" },
            { label: "Fibras",   value: macros.fiberG,   unit: "g", target: targets.fiberG || 25,  color: "bg-accent-2/70" },
          ] as const
        ).map(({ label, value, unit, target, color }, idx) => {
          const pct = Math.min(100, Math.round((value / target) * 100));
          return (
            <div
              key={label}
              className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp animate-fade-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">{label}</div>
                <div className="text-xs text-muted">{pct}%</div>
              </div>
              <div className="mt-1 font-display text-xl tracking-tight text-fg">{value}{unit}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full origin-left rounded-full animate-bar-fill ${color}`}
                  style={{ "--bar-w": `${pct}%`, animationDelay: `${idx * 60 + 150}ms` } as React.CSSProperties}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3">
        {insights.map((i) => (
          <div key={i.id} className="rounded-2xl bg-card/85 p-5 ring-1 ring-border shadow-crisp">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-display text-lg tracking-tight text-fg">{i.title}</div>
                <div className="mt-1 text-sm text-muted">{i.detail}</div>
              </div>
              <Badge tone={levelTone(i.level)}>{i.level.toUpperCase()}</Badge>
            </div>
            <div className="mt-4 rounded-xl bg-card-2/50 p-4 text-sm text-fg/90 ring-1 ring-border">
              <div className="text-xs font-medium text-muted">Ação</div>
              <div className="mt-1">{i.action}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

