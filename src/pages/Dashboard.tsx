import * as React from "react";
import { Link } from "react-router-dom";
import { Award, CalendarCheck, CheckCircle2, Circle, Droplet, Flame, RefreshCcw, Settings2, Sparkles, Target, User2 } from "lucide-react";

import { RecommendationCard } from "@/components/RecommendationCard";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeifSays } from "@/components/LeifSays";
import { leifGreeting } from "@/utils/leifGreeting";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/TextField";
import { catalog } from "@/data/catalog";
import { buildInsights, calcDayMacros } from "@/domain/nutrition/insights";
import { buildDailySeries } from "@/domain/nutrition/series";
import { computeCorrelations } from "@/domain/nutrition/correlation";
import { buildTargets } from "@/domain/nutrition/targets";
import type { CatalogItem, MealSlot, Recommendation } from "@/domain/models";
import { recommendCatalog } from "@/domain/recommend/recommend";
import { STORAGE_KEYS } from "@/storage/keys";
import { useAppStore } from "@/store/useAppStore";
import { addDaysISO, mealSlotLabel, todayISO } from "@/utils/date";

type Tab = "saude" | "doencas" | "performance";
type Metric = "calories" | "adherence" | "protein" | "water";

function tabLabel(tab: Tab) {
  if (tab === "saude") return "Saúde geral";
  if (tab === "doencas") return "Doenças";
  return "Performance";
}

function tabMatches(tab: Tab, item: CatalogItem) {
  if (tab === "saude") return item.type === "recipe" ? item.category === "saude" : item.tags.includes("highFiber");
  if (tab === "doencas") return item.tags.includes("lowGI") || item.tags.includes("lowSodium");
  return item.type === "recipe" ? item.category === "performance" : item.tags.includes("highProtein") || item.tags.includes("preWorkout") || item.tags.includes("postWorkout");
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "accent-2" }) {
  return (
    <div className="h-2 w-full rounded-full bg-card-2 ring-1 ring-border">
      <div className={tone === "accent-2" ? "h-full rounded-full bg-accent-2" : "h-full rounded-full bg-accent"} style={{ width: `${Math.round(clamp01(value) * 100)}%` }} />
    </div>
  );
}

const STREAK_MEDALS = [
  { days: 3, emoji: "🥉", label: "3 dias seguidos" },
  { days: 7, emoji: "🥈", label: "1 semana seguida" },
  { days: 14, emoji: "🥇", label: "2 semanas seguidas" },
  { days: 30, emoji: "🏆", label: "1 mês seguido" },
] as const;

function formatDateTimeShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const recipeCache = useAppStore((s) => s.recipeCache);
  const consumedPlan = useAppStore((s) => s.consumedPlan);
  const waterByDate = useAppStore((s) => s.waterByDate);
  const weightByDate = useAppStore((s) => s.weightByDate);
  const manualByDate = useAppStore((s) => s.manualByDate);
  const checkInByDate = useAppStore((s) => s.checkInByDate);
  const labelScansByDate = useAppStore((s) => s.labelScansByDate);
  const customTargets = useAppStore((s) => s.customTargets);
  const syncDirty = useAppStore((s) => s.syncDirty);
  const syncLastSyncedAt = useAppStore((s) => s.syncLastSyncedAt);
  const addWater = useAppStore((s) => s.addWater);
  const setWater = useAppStore((s) => s.setWater);
  const setWeight = useAppStore((s) => s.setWeight);
  const addManualEntry = useAppStore((s) => s.addManualEntry);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const addToPlan = useAppStore((s) => s.addToPlan);

  const [tab, setTab] = React.useState<Tab>("saude");
  const [selected, setSelected] = React.useState<CatalogItem | null>(null);
  const [dateISO, setDateISO] = React.useState(todayISO());
  const [mealSlot, setMealSlot] = React.useState<MealSlot>("almoco");
  const [periodDays, setPeriodDays] = React.useState<7 | 30>(7);
  const [hasAuthToken, setHasAuthToken] = React.useState<boolean>(() => Boolean(localStorage.getItem(STORAGE_KEYS.authToken)));
  const [metric, setMetricOpen] = React.useState<Metric | null>(null);
  const [openInsightId, setOpenInsightId] = React.useState<string | null>(null);

  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualTitle, setManualTitle] = React.useState("");
  const [manualProtein, setManualProtein] = React.useState("");
  const [manualCarbs, setManualCarbs] = React.useState("");
  const [manualFat, setManualFat] = React.useState("");
  const [manualFiber, setManualFiber] = React.useState("");

  const [weightOpen, setWeightOpen] = React.useState(false);
  const [weightInput, setWeightInput] = React.useState("");

  const [waterOpen, setWaterOpen] = React.useState(false);
  const [waterInput, setWaterInput] = React.useState("");

  const recommendations: Recommendation[] = React.useMemo(() => {
    if (!profile) return [];
    const all = recommendCatalog(profile, catalog, 40);
    return all.filter((r) => tabMatches(tab, r.item)).slice(0, 12);
  }, [profile, tab]);

  const mergedCatalog = React.useMemo(() => [...catalog, ...Object.values(recipeCache)], [recipeCache]);
  const today = todayISO();
  const dayPlan = React.useMemo(() => plan.filter((p) => p.dateISO === today), [plan, today]);
  const consumedTodayPlan = React.useMemo(() => {
    return plan.filter((p) => p.dateISO === today).filter((p) => consumedPlan[p.id]);
  }, [consumedPlan, plan, today]);
  const todayMacros = React.useMemo(() => {
    const m = calcDayMacros({ catalog: mergedCatalog, plan: consumedTodayPlan, dateISO: today });
    const manual = (manualByDate[today] ?? []).reduce(
      (acc, e) => ({
        proteinG: acc.proteinG + e.proteinG,
        carbsG: acc.carbsG + e.carbsG,
        fatG: acc.fatG + e.fatG,
        fiberG: acc.fiberG + e.fiberG,
      }),
      { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );
    const proteinG = Math.round((m.proteinG + manual.proteinG) * 10) / 10;
    const carbsG = Math.round((m.carbsG + manual.carbsG) * 10) / 10;
    const fatG = Math.round((m.fatG + manual.fatG) * 10) / 10;
    const fiberG = Math.round((m.fiberG + manual.fiberG) * 10) / 10;
    return {
      proteinG,
      carbsG,
      fatG,
      fiberG,
      caloriesKcal: Math.round(proteinG * 4 + carbsG * 4 + fatG * 9),
    };
  }, [consumedTodayPlan, manualByDate, mergedCatalog, today]);
  const targets = React.useMemo(() => buildTargets(profile, customTargets), [customTargets, profile]);
  const waterMl = waterByDate[today] ?? 0;
  const greeting = React.useMemo(
    () => leifGreeting({ hour: new Date().getHours(), adherence: dayPlan.length ? dayPlan.filter((p) => consumedPlan[p.id]).length / dayPlan.length : 0, plannedItems: dayPlan.length }),
    [consumedPlan, dayPlan],
  );
  const adherenceToday = React.useMemo(() => {
    const planned = dayPlan.length;
    if (planned === 0) return 0;
    const consumed = dayPlan.filter((p) => consumedPlan[p.id]).length;
    return consumed / planned;
  }, [consumedPlan, dayPlan]);

  const series = React.useMemo(
    () =>
      buildDailySeries({
        catalog: mergedCatalog,
        plan,
        consumedPlan,
        manualByDate,
        waterByDate,
        weightByDate,
        endISO: today,
        days: periodDays,
      }),
    [mergedCatalog, plan, consumedPlan, manualByDate, waterByDate, weightByDate, today, periodDays],
  );
  const hasWeight = React.useMemo(() => series.some((p) => p.weightKg != null), [series]);
  const dayLabel = (iso: string) => iso.slice(8, 10);

  const last7 = React.useMemo(() => series.slice(-7), [series]);
  const checkInToday = checkInByDate[today];
  const labelScansToday = labelScansByDate[today] ?? [];
  const checkInComplete = Boolean(checkInToday && checkInToday.sleepHours != null && checkInToday.mood != null && checkInToday.hunger != null);

  const checklistToday = React.useMemo(() => {
    const waterOk = targets.waterMl > 0 ? waterMl >= targets.waterMl * 0.9 : false;
    const proteinOk = targets.proteinG > 0 ? todayMacros.proteinG >= targets.proteinG * 0.9 : false;
    const fiberOk = targets.fiberG > 0 ? todayMacros.fiberG >= targets.fiberG * 0.9 : false;
    const checkInOk = checkInComplete;
    const weightOk = weightByDate[today] != null;

    const items = [
      {
        id: "water" as const,
        label: "Água",
        detail: `${Math.round(waterMl / 250) * 250} / ${targets.waterMl} ml`,
        done: waterOk,
        onClick: () => setMetricOpen("water"),
      },
      {
        id: "protein" as const,
        label: "Proteína",
        detail: `${todayMacros.proteinG} / ${targets.proteinG} g`,
        done: proteinOk,
        onClick: () => setMetricOpen("protein"),
      },
      {
        id: "fiber" as const,
        label: "Fibras",
        detail: `${todayMacros.fiberG} / ${targets.fiberG} g`,
        done: fiberOk,
        onClick: () => setMetricOpen("calories"),
      },
      {
        id: "checkin" as const,
        label: "Check-in",
        detail: checkInOk ? "completo" : "pendente",
        done: checkInOk,
        onClick: () => window.location.assign(`${import.meta.env.BASE_URL}historico`),
      },
      {
        id: "weight" as const,
        label: "Peso",
        detail: weightByDate[today] != null ? `${weightByDate[today]} kg` : "não registrado",
        done: weightOk,
        onClick: () => {
          const v = weightByDate[today];
          setWeightInput(v != null ? String(v) : "");
          setWeightOpen(true);
        },
      },
    ];

    const doneCount = items.filter((i) => i.done).length;
    return { items, doneCount, total: items.length };
  }, [checkInComplete, setMetricOpen, targets.fiberG, targets.proteinG, targets.waterMl, today, todayMacros.fiberG, todayMacros.proteinG, waterMl, weightByDate]);

  const weekSummary = React.useMemo(() => {
    const dates = last7.map((p) => p.dateISO);

    const byISO = new Map(series.map((p) => [p.dateISO, p]));

    const completion = dates.map((dateISO) => {
      const p = byISO.get(dateISO);
      const waterOk = targets.waterMl > 0 ? (p?.waterMl ?? 0) >= targets.waterMl * 0.9 : false;
      const proteinOk = targets.proteinG > 0 ? (p?.proteinG ?? 0) >= targets.proteinG * 0.9 : false;
      const fiberOk = targets.fiberG > 0 ? (p?.fiberG ?? 0) >= targets.fiberG * 0.9 : false;
      const c = checkInByDate[dateISO];
      const checkInOk = Boolean(c && c.sleepHours != null && c.mood != null && c.hunger != null);
      const weightOk = weightByDate[dateISO] != null;
      const doneCount = [waterOk, proteinOk, fiberOk, checkInOk, weightOk].filter(Boolean).length;
      const isPerfect = doneCount === 5;
      return { dateISO, doneCount, isPerfect };
    });

    const currentStreak = (() => {
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const dateISO = addDaysISO(today, -i);
        const p = byISO.get(dateISO);
        const waterOk = targets.waterMl > 0 ? (p?.waterMl ?? 0) >= targets.waterMl * 0.9 : false;
        const proteinOk = targets.proteinG > 0 ? (p?.proteinG ?? 0) >= targets.proteinG * 0.9 : false;
        const fiberOk = targets.fiberG > 0 ? (p?.fiberG ?? 0) >= targets.fiberG * 0.9 : false;
        const c = checkInByDate[dateISO];
        const checkInOk = Boolean(c && c.sleepHours != null && c.mood != null && c.hunger != null);
        const weightOk = weightByDate[dateISO] != null;
        const ok = waterOk && proteinOk && fiberOk && checkInOk && weightOk;
        if (!ok) break;
        streak++;
      }
      return streak;
    })();

    const perfectDays = completion.filter((d) => d.isPerfect).length;
    return { completion, currentStreak, perfectDays };
  }, [addDaysISO, checkInByDate, last7, series, targets.fiberG, targets.proteinG, targets.waterMl, today, weightByDate]);

  const correlations = React.useMemo(() => {
    const s = buildDailySeries({ catalog: mergedCatalog, plan, consumedPlan, manualByDate, waterByDate, weightByDate, endISO: today, days: 30 });
    return computeCorrelations({ series: s, checkInByDate });
  }, [mergedCatalog, plan, consumedPlan, manualByDate, waterByDate, weightByDate, today, checkInByDate]);

  const insightsToday = React.useMemo(() => {
    return buildInsights({
      profile,
      catalog: mergedCatalog,
      plan: dayPlan,
      dateISO: today,
      targetsOverride: customTargets ?? null,
      waterMl,
      labelScans: labelScansToday,
    }).slice(0, 3);
  }, [customTargets, dayPlan, mergedCatalog, profile, today, waterMl, labelScansToday]);

  const syncPending = Boolean(syncDirty.profile || syncDirty.plan || syncDirty.tracking || syncDirty.prefs);
  const lastSync = React.useMemo(() => {
    const times = [syncLastSyncedAt.profile, syncLastSyncedAt.plan, syncLastSyncedAt.tracking, syncLastSyncedAt.prefs].filter(Boolean) as string[];
    if (times.length === 0) return null;
    return times.sort().at(-1) ?? null;
  }, [syncLastSyncedAt]);

  React.useEffect(() => {
    const onStorage = () => setHasAuthToken(Boolean(localStorage.getItem(STORAGE_KEYS.authToken)));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const openAdd = (item: CatalogItem) => {
    setSelected(item);
    setDateISO(todayISO());
    setMealSlot("almoco");
  };

  const commitAdd = () => {
    if (!selected) return;
    addToPlan({ item: selected, dateISO, mealSlot, servings: 1 });
    setSelected(null);
  };

  const openManual = () => {
    setManualTitle("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    setManualFiber("");
    setManualOpen(true);
  };

  const commitManual = () => {
    const title = manualTitle.trim();
    if (!title) return;
    addManualEntry({
      dateISO: today,
      title,
      proteinG: Number(manualProtein) || 0,
      carbsG: Number(manualCarbs) || 0,
      fatG: Number(manualFat) || 0,
      fiberG: Number(manualFiber) || 0,
    });
    setManualOpen(false);
  };

  const openWeight = () => {
    const v = weightByDate[today];
    setWeightInput(v != null ? String(v) : "");
    setWeightOpen(true);
  };

  const commitWeight = () => {
    const raw = weightInput.trim();
    if (!raw) {
      setWeight(today, null);
      setWeightOpen(false);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    setWeight(today, n);
    setWeightOpen(false);
  };

  const openWater = () => {
    setWaterInput(String(waterMl));
    setWaterOpen(true);
  };

  const commitWater = () => {
    const n = Number(waterInput);
    if (!Number.isFinite(n)) return;
    setWater(today, n);
    setWaterOpen(false);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight text-fg">Painel</div>
          <div className="mt-1 max-w-2xl text-sm text-muted">Resumo do dia, evolução e recomendações personalizadas.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/perfil"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-card-2 px-4 text-sm font-medium text-fg ring-1 ring-border shadow-crisp transition hover:bg-card active:translate-y-px active:shadow-none"
          >
            <User2 className="h-4 w-4" />
            Perfil
          </Link>
          <Link
            to="/configuracoes"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-card-2 px-4 text-sm font-medium text-fg ring-1 ring-border shadow-crisp transition hover:bg-card active:translate-y-px active:shadow-none"
          >
            <Settings2 className="h-4 w-4" />
            Configurações
          </Link>
        </div>
      </div>

      {!profile ? (
        <Card className="animate-fade-up">
          <CardContent className="grid gap-4 pt-5">
            <LeifSays
              mood="motivate"
              message="Saudações, guerreiro! Antes da batalha, forje seu perfil — assim eu calculo suas metas, recomendações e alertas sob medida."
            />
            <div className="flex flex-wrap gap-2">
              <Link
                to="/perfil"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-fg shadow-crisp transition hover:brightness-[1.02] active:translate-y-px active:shadow-none"
              >
                ⚔️ Forjar guerreiro
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {adherenceToday >= 1 && dayPlan.length > 0 ? (
            <Card className="animate-fade-up ring-gold/30">
              <CardContent className="pt-5">
                <LeifSays
                  mood="celebrate"
                  message="Conquista do dia completa! Você consumiu tudo que planejou. Festeje como um verdadeiro guerreiro! 🎉"
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="animate-fade-up">
              <CardContent className="pt-5">
                <LeifSays mood={greeting.mood} message={greeting.message} />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="grid gap-6">
              <Card className="animate-fade-up">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Hoje</CardTitle>
                    <div className="mt-1 text-sm text-muted">Progresso baseado no que você marcou como consumido no Plano e nos registros manuais.</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => addWater(today, 250)}>
                      +250ml
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => addWater(today, 500)}>
                      +500ml
                    </Button>
                    <Link
                      to="/historico"
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-card-2 px-3 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card"
                    >
                      Abrir histórico
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                      icon={<Flame className="h-4 w-4" />}
                      title="Calorias"
                      value={`${todayMacros.caloriesKcal} kcal`}
                      subtitle={targets.caloriesKcal ? `Meta: ${targets.caloriesKcal} kcal` : undefined}
                      progress={targets.caloriesKcal ? todayMacros.caloriesKcal / targets.caloriesKcal : undefined}
                      trend={last7.map((p) => p.caloriesKcal)}
                      tone="accent-2"
                    onClick={() => setMetricOpen("calories")}
                    />
                    <StatCard
                      icon={<Target className="h-4 w-4" />}
                      title="Aderência ao plano"
                      value={`${Math.round(adherenceToday * 100)}%`}
                      subtitle={`${dayPlan.filter((p) => consumedPlan[p.id]).length} / ${dayPlan.length} itens`}
                      progress={adherenceToday}
                      trend={last7.map((p) => Math.round(p.adherence * 100))}
                      tone="viking-blue"
                    onClick={() => setMetricOpen("adherence")}
                    />
                    <StatCard
                      icon={<Sparkles className="h-4 w-4" />}
                      title="Proteína"
                      value={`${todayMacros.proteinG} g`}
                      subtitle={`Meta: ${targets.proteinG} g`}
                      progress={targets.proteinG > 0 ? todayMacros.proteinG / targets.proteinG : 0}
                      trend={last7.map((p) => p.proteinG)}
                      tone="accent"
                    onClick={() => setMetricOpen("protein")}
                    />
                    <StatCard
                      icon={<Droplet className="h-4 w-4" />}
                      title="Água"
                      value={`${Math.round(waterMl / 250) * 250} ml`}
                      subtitle={`Meta: ${targets.waterMl} ml`}
                      progress={targets.waterMl > 0 ? waterMl / targets.waterMl : 0}
                      trend={last7.map((p) => p.waterMl)}
                      tone="gold"
                    onClick={() => setMetricOpen("water")}
                    />
                  </div>

                  <div className="grid gap-3 rounded-2xl bg-card/50 p-4 ring-1 ring-border">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-fg">Metas do dia</div>
                      <Link to="/insights" className="text-xs font-medium text-accent hover:underline">
                        Ver alertas
                      </Link>
                    </div>
                    {targets.caloriesKcal ? (
                      <div className="grid gap-2">
                        <div className="flex items-baseline justify-between">
                          <div className="text-xs font-medium text-fg/90">Calorias</div>
                          <div className="text-xs text-muted tabular-nums">
                            {todayMacros.caloriesKcal} / {targets.caloriesKcal} kcal
                          </div>
                        </div>
                        <ProgressBar value={todayMacros.caloriesKcal / targets.caloriesKcal} tone="accent-2" />
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <div className="flex items-baseline justify-between">
                          <div className="text-xs font-medium text-fg/90">Proteína</div>
                          <div className="text-xs text-muted tabular-nums">
                            {todayMacros.proteinG} / {targets.proteinG} g
                          </div>
                        </div>
                        <ProgressBar value={targets.proteinG > 0 ? todayMacros.proteinG / targets.proteinG : 0} />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-baseline justify-between">
                          <div className="text-xs font-medium text-fg/90">Fibras</div>
                          <div className="text-xs text-muted tabular-nums">
                            {todayMacros.fiberG} / {targets.fiberG} g
                          </div>
                        </div>
                        <ProgressBar value={targets.fiberG > 0 ? todayMacros.fiberG / targets.fiberG : 0} />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-baseline justify-between">
                          <div className="text-xs font-medium text-fg/90">Água</div>
                          <div className="text-xs text-muted tabular-nums">
                            {Math.round(waterMl / 250) * 250} / {targets.waterMl} ml
                          </div>
                        </div>
                        <ProgressBar value={targets.waterMl > 0 ? waterMl / targets.waterMl : 0} />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-baseline justify-between">
                          <div className="text-xs font-medium text-fg/90">Aderência</div>
                          <div className="text-xs text-muted tabular-nums">{Math.round(adherenceToday * 100)}%</div>
                        </div>
                        <ProgressBar value={adherenceToday} tone="accent-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-up" style={{ animationDelay: "60ms" } as React.CSSProperties}>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Evolução</CardTitle>
                    <div className="mt-1 text-sm text-muted">Últimos {periodDays} dias.</div>
                  </div>
                  <div className="flex gap-2">
                    {([7, 30] as const).map((d) => (
                      <Chip key={d} active={periodDays === d} onClick={() => setPeriodDays(d)} type="button">
                        {d} dias
                      </Chip>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {hasWeight ? (
                      <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                        <div className="text-xs font-medium text-fg/90">Peso (kg)</div>
                        <LineChart data={series.map((p) => ({ label: dayLabel(p.dateISO), value: p.weightKg }))} unit="kg" />
                      </div>
                    ) : (
                      <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                        <div className="text-xs font-medium text-fg/90">Peso (kg)</div>
                        <div className="flex h-[120px] items-center justify-center rounded-xl bg-card/50 px-4 text-center text-xs text-muted ring-1 ring-border">
                          Registre seu peso no Histórico para ver a evolução aqui.
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                      <div className="text-xs font-medium text-fg/90">Proteína (g/dia)</div>
                      <BarChart data={series.map((p) => ({ label: dayLabel(p.dateISO), value: p.proteinG }))} target={targets.proteinG} unit="g" />
                    </div>

                    {targets.caloriesKcal ? (
                      <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                        <div className="text-xs font-medium text-fg/90">Calorias (kcal/dia)</div>
                        <BarChart data={series.map((p) => ({ label: dayLabel(p.dateISO), value: p.caloriesKcal }))} target={targets.caloriesKcal} unit="" />
                      </div>
                    ) : null}

                    <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                      <div className="text-xs font-medium text-fg/90">Aderência ao plano (%)</div>
                      <BarChart data={series.map((p) => ({ label: dayLabel(p.dateISO), value: Math.round(p.adherence * 100) }))} target={100} unit="%" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-up" style={{ animationDelay: "120ms" } as React.CSSProperties}>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Recomendações</CardTitle>
                    <div className="mt-1 text-sm text-muted">Sugestões alinhadas ao seu objetivo e restrições.</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["saude", "doencas", "performance"] as Tab[]).map((t) => (
                      <Chip key={t} active={tab === t} onClick={() => setTab(t)} type="button">
                        {tabLabel(t)}
                      </Chip>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {recommendations.length === 0 ? (
                    <div className="rounded-2xl bg-card/50 p-5 text-sm text-muted ring-1 ring-border">
                      Sem recomendações para esta categoria. Ajuste seu perfil ou tente outra aba.
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {recommendations.map((rec, idx) => (
                        <RecommendationCard
                          key={`${rec.item.type}_${rec.item.id}`}
                          rec={rec}
                          isFavorite={isFavorite(rec.item)}
                          onToggleFavorite={() => toggleFavorite(rec.item)}
                          onAddToPlan={() => openAdd(rec.item)}
                          animationDelay={Math.min(idx * 50, 350)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card className="animate-fade-up" style={{ animationDelay: "20ms" } as React.CSSProperties}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Checklist de hoje</CardTitle>
                  <div className="text-xs font-medium text-muted tabular-nums">{checklistToday.doneCount}/{checklistToday.total}</div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-fg/90">Progresso</div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-gold" />
                        <div className="text-xs font-medium text-fg tabular-nums">
                          streak {weekSummary.currentStreak}d
                        </div>
                      </div>
                    </div>
                    <ProgressBar value={checklistToday.total ? checklistToday.doneCount / checklistToday.total : 0} tone="accent-2" />
                    <div className="mt-2 grid grid-cols-7 gap-1">
                      {weekSummary.completion.map((d) => {
                        const cls =
                          d.doneCount >= 5
                            ? "bg-accent"
                            : d.doneCount >= 3
                              ? "bg-accent-2/80"
                              : d.doneCount >= 1
                                ? "bg-card"
                                : "bg-card-2";
                        return (
                          <div
                            key={d.dateISO}
                            title={`${d.dateISO} • ${d.doneCount}/5`}
                            className={`h-2 rounded-full ring-1 ring-border ${cls}`}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      Semana: {weekSummary.perfectDays}/7 dias perfeitos
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {STREAK_MEDALS.map((m) => {
                        const earned = weekSummary.currentStreak >= m.days;
                        return (
                          <div
                            key={m.days}
                            title={earned ? `Conquistado: ${m.label}` : `Bloqueado: ${m.label}`}
                            className={[
                              "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 transition",
                              earned
                                ? "bg-gold/15 text-fg ring-gold/35"
                                : "bg-card-2/40 text-muted opacity-55 ring-border",
                            ].join(" ")}
                          >
                            <span className={earned ? "" : "grayscale"}>{m.emoji}</span>
                            <span className="tabular-nums">{m.days}d</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {checklistToday.items.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={it.onClick}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-card-2/35 px-4 py-3 text-left ring-1 ring-border transition hover:bg-card-2/55 hover:ring-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {it.done ? (
                            <CheckCircle2 className="h-5 w-5 text-accent" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted" />
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-fg">{it.label}</div>
                            <div className="truncate text-xs text-muted">{it.detail}</div>
                          </div>
                        </div>
                        <div className={it.done ? "text-xs font-medium text-accent" : "text-xs font-medium text-muted"}>
                          {it.done ? "ok" : "fazer"}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {correlations.length > 0 && (
                <Card className="animate-fade-up" style={{ animationDelay: "30ms" } as React.CSSProperties}>
                  <CardHeader>
                    <CardTitle>Correlações</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <div className="text-xs text-muted">Tendências observadas nos últimos 30 dias (não indicam causa).</div>
                    {correlations.map((c) => (
                      <div key={c.id} className="rounded-2xl bg-card-2/35 p-3 ring-1 ring-border">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-fg">{c.label}</div>
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                              c.strength === "forte"
                                ? "bg-accent/15 text-fg ring-accent/30"
                                : c.strength === "moderada"
                                  ? "bg-gold/15 text-fg ring-gold/30"
                                  : "bg-card-2/60 text-muted ring-border",
                            ].join(" ")}
                          >
                            {c.strength} · r={c.r}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted">{c.text}</div>
                        <div className="mt-0.5 text-[10px] text-muted/70">{c.n} dias com dados</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="animate-fade-up" style={{ animationDelay: "40ms" } as React.CSSProperties}>
                <CardHeader>
                  <CardTitle>Ações rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <button
                    type="button"
                    onClick={openManual}
                    className="inline-flex h-11 items-center justify-between rounded-xl bg-card-2/50 px-4 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card-2"
                  >
                    <span>Adicionar consumo manual</span>
                    <span className="text-xs text-muted">rápido</span>
                  </button>
                  <button
                    type="button"
                    onClick={openWeight}
                    className="inline-flex h-11 items-center justify-between rounded-xl bg-card-2/50 px-4 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card-2"
                  >
                    <span>Registrar peso</span>
                    <span className="text-xs text-muted">{weightByDate[today] != null ? `${weightByDate[today]} kg` : "—"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={openWater}
                    className="inline-flex h-11 items-center justify-between rounded-xl bg-card-2/50 px-4 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card-2"
                  >
                    <span>Ajustar água</span>
                    <span className="text-xs text-muted">{Math.round(waterMl / 250) * 250} ml</span>
                  </button>
                  <Link
                    to="/plano"
                    className="inline-flex h-11 items-center justify-between rounded-xl bg-card-2/50 px-4 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card-2"
                  >
                    <span>Ver plano</span>
                    <span className="text-xs text-muted">{dayPlan.length} itens hoje</span>
                  </Link>
                  <Link
                    to="/historico"
                    className="inline-flex h-11 items-center justify-between rounded-xl bg-card-2/50 px-4 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card-2"
                  >
                    <span>Registrar check-in</span>
                    <span className="text-xs text-muted">{checkInComplete ? "feito" : "pendente"}</span>
                  </Link>
                  <Link
                    to="/insights"
                    className="inline-flex h-11 items-center justify-between rounded-xl bg-card-2/50 px-4 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card-2"
                  >
                    <span>Ver alertas</span>
                    <span className="text-xs text-muted">{insightsToday.length} hoje</span>
                  </Link>
                </CardContent>
              </Card>

              <Card className="animate-fade-up" style={{ animationDelay: "60ms" } as React.CSSProperties}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Alertas do dia</CardTitle>
                  <Link to="/insights" className="text-xs font-medium text-accent hover:underline">
                    Abrir
                  </Link>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {insightsToday.length === 0 ? (
                    <div className="rounded-2xl bg-card-2/35 p-4 text-sm text-muted ring-1 ring-border">
                      Nada crítico por aqui. Continue registrando para melhorar os alertas.
                    </div>
                  ) : (
                    insightsToday.map((i) => {
                      const level =
                        i.level === "alto" ? "ALTO" : i.level === "medio" ? "MÉDIO" : "BAIXO";
                      const levelClass =
                        i.level === "alto"
                          ? "bg-rust/15 text-rust ring-1 ring-rust/25"
                          : i.level === "medio"
                            ? "bg-accent-2/12 text-accent-2 ring-1 ring-accent-2/25"
                            : "bg-accent/12 text-accent ring-1 ring-accent/25";
                      const open = openInsightId === i.id;
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => setOpenInsightId((prev) => (prev === i.id ? null : i.id))}
                          className="w-full rounded-2xl bg-card-2/35 p-4 text-left ring-1 ring-border transition hover:bg-card-2/55 hover:ring-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-fg">{i.title}</div>
                              <div className="mt-1 text-xs text-muted">{open ? i.detail : i.detail}</div>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${levelClass}`}>{level}</span>
                          </div>
                          {open ? (
                            <div className="mt-3 rounded-xl bg-card/50 p-3 text-xs text-muted ring-1 ring-border">
                              <div className="font-medium text-fg/90">Ação</div>
                              <div className="mt-1">{i.action}</div>
                            </div>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="animate-fade-up" style={{ animationDelay: "80ms" } as React.CSSProperties}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Status do dia</CardTitle>
                  <CalendarCheck className="h-4 w-4 text-muted" />
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-fg/90">Check-in</div>
                      <div className={checkInComplete ? "text-xs font-medium text-accent" : "text-xs font-medium text-muted"}>
                        {checkInComplete ? "Completo" : "Incompleto"}
                      </div>
                    </div>
                    <div className="mt-1 grid gap-1 text-xs text-muted">
                      <div className="flex items-center justify-between">
                        <span>Sono</span>
                        <span className="tabular-nums">{checkInToday?.sleepHours != null ? `${checkInToday.sleepHours}h` : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Humor</span>
                        <span className="tabular-nums">{checkInToday?.mood != null ? `${checkInToday.mood}/5` : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fome</span>
                        <span className="tabular-nums">{checkInToday?.hunger != null ? `${checkInToday.hunger}/5` : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Treino</span>
                        <span className="tabular-nums">{checkInToday ? (checkInToday.training ? "sim" : "não") : "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-fg/90">Rótulos rápidos</div>
                      <div className="text-xs font-medium text-muted tabular-nums">{labelScansToday.length}</div>
                    </div>
                    <div className="text-xs text-muted">Use o Histórico para registrar açúcar e sódio e receber alertas.</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-up" style={{ animationDelay: "120ms" } as React.CSSProperties}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Conta e sincronização</CardTitle>
                  <RefreshCcw className="h-4 w-4 text-muted" />
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-fg/90">Conta</div>
                      <div className={hasAuthToken ? "text-xs font-medium text-accent" : "text-xs font-medium text-muted"}>
                        {hasAuthToken ? "Conectado" : "Desconectado"}
                      </div>
                    </div>
                    <div className="text-xs text-muted">Gerencie login, backup e API em Configurações.</div>
                  </div>

                  <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-fg/90">Sincronização</div>
                      <div className={syncPending ? "text-xs font-medium text-accent-2" : "text-xs font-medium text-accent"}>
                        {syncPending ? "Pendente" : "OK"}
                      </div>
                    </div>
                    <div className="text-xs text-muted">
                      {lastSync ? `Última: ${formatDateTimeShort(lastSync)}` : "Ainda não sincronizou neste dispositivo."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Modal open={metric != null} title={metric === "calories" ? "Calorias" : metric === "protein" ? "Proteína" : metric === "water" ? "Água" : "Aderência"} onClose={() => setMetricOpen(null)}>
        {metric ? (
          <div className="grid gap-4">
            {metric === "calories" ? (
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <div className="text-sm font-semibold text-fg">{todayMacros.caloriesKcal} kcal</div>
                  {targets.caloriesKcal ? <div className="text-xs text-muted">Meta: {targets.caloriesKcal} kcal</div> : null}
                </div>
                <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                  <div className="text-xs font-medium text-fg/90">Últimos {periodDays} dias</div>
                  <BarChart data={series.map((p) => ({ label: dayLabel(p.dateISO), value: p.caloriesKcal }))} target={targets.caloriesKcal} unit="" />
                </div>
                <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                  <div className="text-xs font-medium text-fg/90">Macros (hoje)</div>
                  <div className="grid gap-1 text-xs text-muted">
                    <div className="flex items-center justify-between"><span>Proteína</span><span className="tabular-nums">{todayMacros.proteinG} g</span></div>
                    <div className="flex items-center justify-between"><span>Carboidrato</span><span className="tabular-nums">{todayMacros.carbsG} g</span></div>
                    <div className="flex items-center justify-between"><span>Gordura</span><span className="tabular-nums">{todayMacros.fatG} g</span></div>
                    <div className="flex items-center justify-between"><span>Fibras</span><span className="tabular-nums">{todayMacros.fiberG} g</span></div>
                  </div>
                </div>
              </div>
            ) : null}

            {metric === "protein" ? (
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <div className="text-sm font-semibold text-fg">{todayMacros.proteinG} g</div>
                  <div className="text-xs text-muted">Meta: {targets.proteinG} g</div>
                </div>
                <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                  <div className="text-xs font-medium text-fg/90">Últimos {periodDays} dias</div>
                  <BarChart data={series.map((p) => ({ label: dayLabel(p.dateISO), value: p.proteinG }))} target={targets.proteinG} unit="g" />
                </div>
              </div>
            ) : null}

            {metric === "water" ? (
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <div className="text-sm font-semibold text-fg">{Math.round(waterMl / 250) * 250} ml</div>
                  <div className="text-xs text-muted">Meta: {targets.waterMl} ml</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => addWater(today, 250)}>
                    +250ml
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => addWater(today, 500)}>
                    +500ml
                  </Button>
                  <Button variant="secondary" size="sm" onClick={openWater}>
                    Ajustar
                  </Button>
                </div>
                <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                  <div className="text-xs font-medium text-fg/90">Últimos {periodDays} dias</div>
                  <BarChart data={series.map((p) => ({ label: dayLabel(p.dateISO), value: p.waterMl }))} target={targets.waterMl} unit="ml" />
                </div>
              </div>
            ) : null}

            {metric === "adherence" ? (
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <div className="text-sm font-semibold text-fg">{Math.round(adherenceToday * 100)}%</div>
                  <div className="text-xs text-muted">{dayPlan.filter((p) => consumedPlan[p.id]).length} / {dayPlan.length} itens hoje</div>
                </div>
                <div className="grid gap-2 rounded-2xl bg-card-2/35 p-4 ring-1 ring-border">
                  <div className="text-xs font-medium text-fg/90">Últimos {periodDays} dias</div>
                  <BarChart data={series.map((p) => ({ label: dayLabel(p.dateISO), value: Math.round(p.adherence * 100) }))} target={100} unit="%" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/plano"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-card-2 px-4 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card"
                  >
                    Abrir plano
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal open={manualOpen} title="Adicionar consumo manual" onClose={() => setManualOpen(false)}>
        <div className="grid gap-4">
          <TextField label="Nome" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Ex.: iogurte, banana, shake" />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Proteína (g)" inputMode="decimal" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} />
            <TextField label="Carboidrato (g)" inputMode="decimal" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} />
            <TextField label="Gordura (g)" inputMode="decimal" value={manualFat} onChange={(e) => setManualFat(e.target.value)} />
            <TextField label="Fibras (g)" inputMode="decimal" value={manualFiber} onChange={(e) => setManualFiber(e.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setManualOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={commitManual} disabled={!manualTitle.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={weightOpen} title="Registrar peso" onClose={() => setWeightOpen(false)}>
        <div className="grid gap-4">
          <TextField label="Peso (kg)" inputMode="decimal" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="Ex.: 78.4" />
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setWeightOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={commitWeight}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={waterOpen} title="Ajustar água" onClose={() => setWaterOpen(false)}>
        <div className="grid gap-4">
          <TextField label="Água (ml)" inputMode="numeric" value={waterInput} onChange={(e) => setWaterInput(e.target.value)} placeholder="Ex.: 1500" />
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setWaterOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={commitWater}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selected} title="Adicionar ao plano" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="grid gap-4">
            <div className="text-sm text-muted">
              {selected.type === "recipe" ? selected.title : selected.type === "food" ? selected.title : selected.name}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="Dia" value={dateISO} onChange={(e) => setDateISO(e.target.value)}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = addDaysISO(todayISO(), i);
                  return (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  );
                })}
              </SelectField>
              <SelectField label="Refeição" value={mealSlot} onChange={(e) => setMealSlot(e.target.value as MealSlot)}>
                {(["cafe", "almoco", "lanche", "jantar"] as MealSlot[]).map((s) => (
                  <option key={s} value={s}>
                    {mealSlotLabel(s)}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Cancelar
              </Button>
              <Button onClick={commitAdd}>Adicionar</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
