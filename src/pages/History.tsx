import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { catalog } from "@/data/catalog";
import { getItem, itemTitle } from "@/domain/catalog";
import { calcDayMacros } from "@/domain/nutrition/insights";
import { buildTargets } from "@/domain/nutrition/targets";
import type { CatalogItem, MealSlot, PlanItem } from "@/domain/models";
import { useAppStore } from "@/store/useAppStore";
import { addDaysISO, mealSlotLabel, todayISO } from "@/utils/date";

const slots: MealSlot[] = ["cafe", "almoco", "lanche", "jantar"];

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

function dayList() {
  const end = todayISO();
  return Array.from({ length: 14 }).map((_, idx) => addDaysISO(end, -idx));
}

export default function HistoryPage() {
  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const recipeCache = useAppStore((s) => s.recipeCache);
  const consumedPlan = useAppStore((s) => s.consumedPlan);
  const waterByDate = useAppStore((s) => s.waterByDate);
  const addWater = useAppStore((s) => s.addWater);
  const setWater = useAppStore((s) => s.setWater);
  const toggleConsumed = useAppStore((s) => s.toggleConsumed);

  const mergedCatalog: CatalogItem[] = React.useMemo(() => [...catalog, ...Object.values(recipeCache)], [recipeCache]);
  const targets = React.useMemo(() => buildTargets(profile), [profile]);
  const days = React.useMemo(() => dayList(), []);

  const [selectedDate, setSelectedDate] = React.useState(todayISO());

  const selectedPlan = React.useMemo(() => {
    return plan.filter((p) => p.dateISO === selectedDate).slice().sort((a, b) => slots.indexOf(a.mealSlot) - slots.indexOf(b.mealSlot));
  }, [plan, selectedDate]);

  const consumedSelectedPlan = React.useMemo(() => {
    return selectedPlan.filter((p) => consumedPlan[p.id]);
  }, [consumedPlan, selectedPlan]);

  const macros = React.useMemo(() => {
    return calcDayMacros({ catalog: mergedCatalog, plan: consumedSelectedPlan, dateISO: selectedDate });
  }, [consumedSelectedPlan, mergedCatalog, selectedDate]);

  const waterMl = waterByDate[selectedDate] ?? 0;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight text-fg">Histórico</div>
          <div className="mt-1 text-sm text-muted">Acompanhe consumo marcado no Plano e hidratação.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/plano"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-card-2 px-4 text-sm font-medium text-fg ring-1 ring-border shadow-crisp transition hover:bg-card active:translate-y-px active:shadow-none"
          >
            Ir para o plano
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp">
          <div className="text-xs font-medium text-fg/90">Últimos 14 dias</div>
          <div className="mt-3 grid gap-2">
            {days.map((d) => {
              const dayPlan = plan.filter((p) => p.dateISO === d);
              const consumed = dayPlan.filter((p) => consumedPlan[p.id]).length;
              const water = waterByDate[d] ?? 0;
              const isActive = d === selectedDate;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm ring-1 transition",
                    isActive ? "bg-accent/16 text-fg ring-accent/30" : "bg-card-2/45 text-muted ring-border hover:bg-card-2/70 hover:text-fg",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-fg">{d}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {consumed}/{dayPlan.length} consumido · {Math.round(water / 250) * 250}ml água
                    </div>
                  </div>
                  <div className="text-[11px] text-muted">ver</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-card/80 p-5 ring-1 ring-border shadow-crisp">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-display text-xl tracking-tight text-fg">{selectedDate}</div>
                <div className="mt-1 text-sm text-muted">
                  {consumedSelectedPlan.length}/{selectedPlan.length} item(ns) consumido(s)
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => addWater(selectedDate, 250)}>
                  +250ml
                </Button>
                <Button variant="secondary" size="sm" onClick={() => addWater(selectedDate, 500)}>
                  +500ml
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setWater(selectedDate, 0)}>
                  Zerar água
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2 rounded-2xl bg-card-2/45 p-4 ring-1 ring-border">
                <div className="text-xs font-medium text-fg/90">Proteína</div>
                <div className="text-sm text-muted">
                  {macros.proteinG}g / {targets.proteinG}g
                </div>
                <ProgressBar value={targets.proteinG > 0 ? macros.proteinG / targets.proteinG : 0} />
              </div>
              <div className="grid gap-2 rounded-2xl bg-card-2/45 p-4 ring-1 ring-border">
                <div className="text-xs font-medium text-fg/90">Fibras</div>
                <div className="text-sm text-muted">
                  {macros.fiberG}g / {targets.fiberG}g
                </div>
                <ProgressBar value={targets.fiberG > 0 ? macros.fiberG / targets.fiberG : 0} />
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

          <div className="rounded-2xl bg-card/80 p-5 ring-1 ring-border shadow-crisp">
            <div className="flex items-center justify-between gap-3">
              <div className="font-display text-lg tracking-tight text-fg">Consumo do dia</div>
              <div className="text-xs text-muted">{selectedPlan.length} item(ns)</div>
            </div>

            {selectedPlan.length === 0 ? (
              <div className="mt-3 text-sm text-muted">
                Sem itens no plano para este dia. Adicione no <Link to="/plano" className="text-fg underline">Plano</Link>.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {slots.map((slot) => {
                  const slotItems: PlanItem[] = selectedPlan.filter((p) => p.mealSlot === slot);
                  if (slotItems.length === 0) return null;
                  return (
                    <div key={slot} className="grid gap-2 rounded-2xl bg-card-2/45 p-4 ring-1 ring-border">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-medium text-fg/90">{mealSlotLabel(slot)}</div>
                        <div className="text-[11px] text-muted">{slotItems.length} item(ns)</div>
                      </div>
                      <div className="grid gap-2">
                        {slotItems.map((p) => {
                          const item = getItem(mergedCatalog, { type: p.itemType, id: p.itemId });
                          const title = item ? itemTitle(item) : "Item";
                          const isConsumed = !!consumedPlan[p.id];
                          return (
                            <label key={p.id} className="flex items-start justify-between gap-3 rounded-xl bg-card/70 p-3 ring-1 ring-border">
                              <div className="min-w-0">
                                <div className="truncate font-medium text-fg">{title}</div>
                                <div className="mt-0.5 text-xs text-muted">{p.itemType} · {p.servings} porção(ões)</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isConsumed}
                                onChange={() => toggleConsumed(p.id)}
                                className="mt-1 h-4 w-4 accent-[hsl(var(--accent))]"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

