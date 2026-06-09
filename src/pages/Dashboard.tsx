import * as React from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Droplet, Flame, RefreshCcw, Settings2, Sparkles, Target, User2 } from "lucide-react";

import { RecommendationCard } from "@/components/RecommendationCard";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeifSays } from "@/components/LeifSays";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/TextField";
import { catalog } from "@/data/catalog";
import { buildInsights, calcDayMacros } from "@/domain/nutrition/insights";
import { buildDailySeries } from "@/domain/nutrition/series";
import { buildTargets } from "@/domain/nutrition/targets";
import type { CatalogItem, MealSlot, Recommendation } from "@/domain/models";
import { recommendCatalog } from "@/domain/recommend/recommend";
import { STORAGE_KEYS } from "@/storage/keys";
import { useAppStore } from "@/store/useAppStore";
import { addDaysISO, mealSlotLabel, todayISO } from "@/utils/date";

type Tab = "saude" | "doencas" | "performance";

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
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const addToPlan = useAppStore((s) => s.addToPlan);

  const [tab, setTab] = React.useState<Tab>("saude");
  const [selected, setSelected] = React.useState<CatalogItem | null>(null);
  const [dateISO, setDateISO] = React.useState(todayISO());
  const [mealSlot, setMealSlot] = React.useState<MealSlot>("almoco");
  const [periodDays, setPeriodDays] = React.useState<7 | 30>(7);
  const [hasAuthToken, setHasAuthToken] = React.useState<boolean>(() => Boolean(localStorage.getItem(STORAGE_KEYS.authToken)));

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

  const insightsToday = React.useMemo(() => {
    return buildInsights({ profile, catalog: mergedCatalog, plan: dayPlan, dateISO: today, targetsOverride: customTargets ?? null }).slice(0, 3);
  }, [customTargets, dayPlan, mergedCatalog, profile, today]);

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
          ) : null}

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
                    />
                    <StatCard
                      icon={<Target className="h-4 w-4" />}
                      title="Aderência ao plano"
                      value={`${Math.round(adherenceToday * 100)}%`}
                      subtitle={`${dayPlan.filter((p) => consumedPlan[p.id]).length} / ${dayPlan.length} itens`}
                      progress={adherenceToday}
                      trend={last7.map((p) => Math.round(p.adherence * 100))}
                      tone="viking-blue"
                    />
                    <StatCard
                      icon={<Sparkles className="h-4 w-4" />}
                      title="Proteína"
                      value={`${todayMacros.proteinG} g`}
                      subtitle={`Meta: ${targets.proteinG} g`}
                      progress={targets.proteinG > 0 ? todayMacros.proteinG / targets.proteinG : 0}
                      trend={last7.map((p) => p.proteinG)}
                      tone="accent"
                    />
                    <StatCard
                      icon={<Droplet className="h-4 w-4" />}
                      title="Água"
                      value={`${Math.round(waterMl / 250) * 250} ml`}
                      subtitle={`Meta: ${targets.waterMl} ml`}
                      progress={targets.waterMl > 0 ? waterMl / targets.waterMl : 0}
                      trend={last7.map((p) => p.waterMl)}
                      tone="gold"
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
              <Card className="animate-fade-up" style={{ animationDelay: "40ms" } as React.CSSProperties}>
                <CardHeader>
                  <CardTitle>Ações rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
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
