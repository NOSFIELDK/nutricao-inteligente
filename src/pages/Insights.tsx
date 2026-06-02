import * as React from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Chip";
import { catalog } from "@/data/catalog";
import { buildInsights, calcDayMacros } from "@/domain/nutrition/insights";
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

  const dateISO = todayISO();
  const insights = React.useMemo(() => buildInsights({ profile, catalog, plan, dateISO }), [profile, plan, dateISO]);
  const macros = React.useMemo(() => calcDayMacros({ catalog, plan, dateISO }), [plan, dateISO]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight text-fg">Insights</div>
          <div className="mt-1 text-sm text-muted">Alertas e lacunas prováveis com base no plano de hoje ({dateISO}).</div>
        </div>
        {!profile ? (
          <Link to="/perfil" className="text-sm font-medium text-accent">
            Criar perfil
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp">
          <div className="text-xs text-muted">Proteína</div>
          <div className="mt-1 font-display text-xl tracking-tight text-fg">{macros.proteinG}g</div>
        </div>
        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp">
          <div className="text-xs text-muted">Carbo</div>
          <div className="mt-1 font-display text-xl tracking-tight text-fg">{macros.carbsG}g</div>
        </div>
        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp">
          <div className="text-xs text-muted">Gordura</div>
          <div className="mt-1 font-display text-xl tracking-tight text-fg">{macros.fatG}g</div>
        </div>
        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp">
          <div className="text-xs text-muted">Fibras</div>
          <div className="mt-1 font-display text-xl tracking-tight text-fg">{macros.fiberG}g</div>
        </div>
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

