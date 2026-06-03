import * as React from "react";
import { Link } from "react-router-dom";

import { RecommendationCard } from "@/components/RecommendationCard";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/TextField";
import { catalog } from "@/data/catalog";
import { calcDayMacros } from "@/domain/nutrition/insights";
import { buildTargets } from "@/domain/nutrition/targets";
import type { CatalogItem, MealSlot, Recommendation } from "@/domain/models";
import { recommendCatalog } from "@/domain/recommend/recommend";
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-card-2 ring-1 ring-border">
      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(clamp01(value) * 100)}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const recipeCache = useAppStore((s) => s.recipeCache);
  const consumedPlan = useAppStore((s) => s.consumedPlan);
  const waterByDate = useAppStore((s) => s.waterByDate);
  const manualByDate = useAppStore((s) => s.manualByDate);
  const customTargets = useAppStore((s) => s.customTargets);
  const addWater = useAppStore((s) => s.addWater);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const addToPlan = useAppStore((s) => s.addToPlan);

  const [tab, setTab] = React.useState<Tab>("saude");
  const [selected, setSelected] = React.useState<CatalogItem | null>(null);
  const [dateISO, setDateISO] = React.useState(todayISO());
  const [mealSlot, setMealSlot] = React.useState<MealSlot>("almoco");

  const recommendations: Recommendation[] = React.useMemo(() => {
    if (!profile) return [];
    const all = recommendCatalog(profile, catalog, 40);
    return all.filter((r) => tabMatches(tab, r.item)).slice(0, 12);
  }, [profile, tab]);

  const mergedCatalog = React.useMemo(() => [...catalog, ...Object.values(recipeCache)], [recipeCache]);
  const today = todayISO();
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
    return {
      proteinG: Math.round((m.proteinG + manual.proteinG) * 10) / 10,
      carbsG: Math.round((m.carbsG + manual.carbsG) * 10) / 10,
      fatG: Math.round((m.fatG + manual.fatG) * 10) / 10,
      fiberG: Math.round((m.fiberG + manual.fiberG) * 10) / 10,
    };
  }, [consumedTodayPlan, manualByDate, mergedCatalog, today]);
  const targets = React.useMemo(() => buildTargets(profile, customTargets), [customTargets, profile]);
  const waterMl = waterByDate[today] ?? 0;

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
          <div className="font-display text-2xl tracking-tight text-fg">Conselho dos Deuses</div>
          <div className="mt-1 max-w-2xl text-sm text-muted">
            As divindades nórdicas indicam o caminho. Siga as recomendações e conquiste sua melhor forma.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/perfil"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-card-2 px-4 text-sm font-medium text-fg ring-1 ring-border shadow-crisp transition hover:bg-card active:translate-y-px active:shadow-none"
          >
            Editar perfil
          </Link>
        </div>
      </div>

      {!profile ? (
        <div className="rounded-2xl bg-card/80 p-6 ring-1 ring-border shadow-crisp">
          <div className="font-display text-xl tracking-tight text-fg">Forje seu Guerreiro</div>
          <div className="mt-2 text-sm text-muted">Defina sua missão, restrições e objetivos. O clã precisa conhecer seu guerreiro.</div>
          <div className="mt-4">
            <Link
              to="/perfil"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-fg shadow-crisp transition hover:brightness-[1.02] active:translate-y-px active:shadow-none"
            >
              Forjar Guerreiro
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-card/80 p-5 ring-1 ring-border shadow-crisp">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-display text-xl tracking-tight text-fg">Hoje</div>
                <div className="mt-1 text-sm text-muted">Progresso baseado no que você marcou como consumido no Plano.</div>
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
                  Histórico
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2 rounded-2xl bg-card-2/45 p-4 ring-1 ring-border">
                <div className="text-xs font-medium text-fg/90">Proteína</div>
                <div className="text-sm text-muted">
                  {todayMacros.proteinG}g / {targets.proteinG}g
                </div>
                <ProgressBar value={targets.proteinG > 0 ? todayMacros.proteinG / targets.proteinG : 0} />
              </div>
              <div className="grid gap-2 rounded-2xl bg-card-2/45 p-4 ring-1 ring-border">
                <div className="text-xs font-medium text-fg/90">Fibras</div>
                <div className="text-sm text-muted">
                  {todayMacros.fiberG}g / {targets.fiberG}g
                </div>
                <ProgressBar value={targets.fiberG > 0 ? todayMacros.fiberG / targets.fiberG : 0} />
              </div>
              <div className="grid gap-2 rounded-2xl bg-card-2/45 p-4 ring-1 ring-border">
                <div className="text-xs font-medium text-fg/90">Água</div>
                <div className="text-sm text-muted">
                  {Math.round(waterMl / 250) * 250}ml / {targets.waterMl}ml
                </div>
                <ProgressBar value={targets.waterMl > 0 ? waterMl / targets.waterMl : 0} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["saude", "doencas", "performance"] as Tab[]).map((t) => (
              <Chip key={t} active={tab === t} onClick={() => setTab(t)} type="button">
                {tabLabel(t)}
              </Chip>
            ))}
          </div>

          {recommendations.length === 0 ? (
            <div className="rounded-2xl bg-card/80 p-6 ring-1 ring-border shadow-crisp animate-fade-up">
              <div className="font-display text-lg tracking-tight text-fg">O conselho está em silêncio para esta categoria</div>
              <div className="mt-1 text-sm text-muted">
                Explore outra aba ou refine seu perfil para receber orientações do clã.
              </div>
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
