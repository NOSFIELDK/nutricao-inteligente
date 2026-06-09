import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { catalog } from "@/data/catalog";
import { getItem, itemTitle } from "@/domain/catalog";
import { Badge } from "@/components/ui/Chip";
import { buildInsights, calcDayMacros } from "@/domain/nutrition/insights";
import { buildTargets } from "@/domain/nutrition/targets";
import type { CatalogItem, MealSlot, MoodScore, PlanItem } from "@/domain/models";
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

function levelTone(level: "baixo" | "medio" | "alto") {
  if (level === "alto") return "accent2" as const;
  if (level === "medio") return "accent" as const;
  return "muted" as const;
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
  const weightByDate = useAppStore((s) => s.weightByDate);
  const manualByDate = useAppStore((s) => s.manualByDate);
  const checkInByDate = useAppStore((s) => s.checkInByDate);
  const labelScansByDate = useAppStore((s) => s.labelScansByDate);
  const customTargets = useAppStore((s) => s.customTargets);
  const addWater = useAppStore((s) => s.addWater);
  const setWater = useAppStore((s) => s.setWater);
  const setWeight = useAppStore((s) => s.setWeight);
  const toggleConsumed = useAppStore((s) => s.toggleConsumed);
  const addManualEntry = useAppStore((s) => s.addManualEntry);
  const removeManualEntry = useAppStore((s) => s.removeManualEntry);
  const setCheckIn = useAppStore((s) => s.setCheckIn);
  const addLabelScan = useAppStore((s) => s.addLabelScan);
  const removeLabelScan = useAppStore((s) => s.removeLabelScan);

  const mergedCatalog: CatalogItem[] = React.useMemo(() => [...catalog, ...Object.values(recipeCache)], [recipeCache]);
  const targets = React.useMemo(() => buildTargets(profile, customTargets), [customTargets, profile]);
  const days = React.useMemo(() => dayList(), []);

  const [selectedDate, setSelectedDate] = React.useState(todayISO());
  const [manualTitle, setManualTitle] = React.useState("");
  const [manualProtein, setManualProtein] = React.useState("");
  const [manualCarbs, setManualCarbs] = React.useState("");
  const [manualFat, setManualFat] = React.useState("");
  const [manualFiber, setManualFiber] = React.useState("");

  const [labelProduct, setLabelProduct] = React.useState("");
  const [labelServing, setLabelServing] = React.useState("");
  const [labelCalories, setLabelCalories] = React.useState("");
  const [labelSugar, setLabelSugar] = React.useState("");
  const [labelSodium, setLabelSodium] = React.useState("");

  const selectedPlan = React.useMemo(() => {
    return plan.filter((p) => p.dateISO === selectedDate).slice().sort((a, b) => slots.indexOf(a.mealSlot) - slots.indexOf(b.mealSlot));
  }, [plan, selectedDate]);

  const manualEntries = manualByDate[selectedDate] ?? [];
  const checkIn = checkInByDate[selectedDate] ?? { dateISO: selectedDate, sleepHours: null, mood: null, hunger: null, training: false, notes: "" };
  const labelScans = labelScansByDate[selectedDate] ?? [];

  const consumedSelectedPlan = React.useMemo(() => {
    return selectedPlan.filter((p) => consumedPlan[p.id]);
  }, [consumedPlan, selectedPlan]);

  const macros = React.useMemo(() => {
    const m = calcDayMacros({ catalog: mergedCatalog, plan: consumedSelectedPlan, dateISO: selectedDate });
    const manual = manualEntries.reduce(
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
  }, [consumedSelectedPlan, manualEntries, mergedCatalog, selectedDate]);

  const waterMl = waterByDate[selectedDate] ?? 0;
  const insights = React.useMemo(() => {
    return buildInsights({
      profile,
      catalog: mergedCatalog,
      plan: consumedSelectedPlan,
      dateISO: selectedDate,
      targetsOverride: customTargets,
    });
  }, [profile, mergedCatalog, consumedSelectedPlan, selectedDate, customTargets]);

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
              const manualCount = (manualByDate[d] ?? []).length;
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
                      {consumed}/{dayPlan.length} consumido · {Math.round(water / 250) * 250}ml água · {manualCount} registro(s)
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

            {profile && insights.length > 0 && (
              <div className="mt-5 grid gap-2">
                {insights.slice(0, 3).map((i) => (
                  <div key={i.id} className="flex items-start justify-between gap-4 rounded-xl bg-card-2/45 p-4 ring-1 ring-border">
                    <div className="min-w-0">
                      <div className="font-medium text-fg">{i.title}</div>
                      <div className="mt-1 text-sm text-muted">{i.action}</div>
                    </div>
                    <Badge tone={levelTone(i.level)}>{i.level.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card/80 p-5 ring-1 ring-border shadow-crisp">
            <div className="flex items-center justify-between gap-3">
              <div className="font-display text-lg tracking-tight text-fg">Registro rápido</div>
              <div className="text-xs text-muted">macros opcionais</div>
            </div>
            <div className="mt-4 grid gap-3">
              <TextField label="Item" placeholder="Ex.: iogurte, fruta, sanduíche" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} />
              <div className="grid gap-3 sm:grid-cols-4">
                <TextField label="Proteína (g)" inputMode="decimal" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} />
                <TextField label="Carbo (g)" inputMode="decimal" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} />
                <TextField label="Gordura (g)" inputMode="decimal" value={manualFat} onChange={(e) => setManualFat(e.target.value)} />
                <TextField label="Fibras (g)" inputMode="decimal" value={manualFiber} onChange={(e) => setManualFiber(e.target.value)} />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  onClick={() => {
                    if (!manualTitle.trim()) return;
                    addManualEntry({
                      dateISO: selectedDate,
                      title: manualTitle.trim(),
                      proteinG: Number(manualProtein) || 0,
                      carbsG: Number(manualCarbs) || 0,
                      fatG: Number(manualFat) || 0,
                      fiberG: Number(manualFiber) || 0,
                    });
                    setManualTitle("");
                    setManualProtein("");
                    setManualCarbs("");
                    setManualFat("");
                    setManualFiber("");
                  }}
                  disabled={!manualTitle.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>

            {manualEntries.length > 0 && (
              <div className="mt-4 grid gap-2">
                {manualEntries.map((e) => (
                  <div key={e.id} className="flex items-start justify-between gap-3 rounded-xl bg-card-2/45 p-3 ring-1 ring-border">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-fg">{e.title}</div>
                      <div className="mt-0.5 text-xs text-muted">
                        P {e.proteinG}g · C {e.carbsG}g · G {e.fatG}g · F {e.fiberG}g
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeManualEntry(selectedDate, e.id)}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card/80 p-5 ring-1 ring-border shadow-crisp">
            <div className="flex items-center justify-between gap-3">
              <div className="font-display text-lg tracking-tight text-fg">Check-in do dia</div>
              <div className="text-xs text-muted">sono · humor · fome · treino</div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField
                  label="Peso (kg)"
                  inputMode="decimal"
                  value={weightByDate[selectedDate] == null ? "" : String(weightByDate[selectedDate])}
                  onChange={(e) => setWeight(selectedDate, e.target.value ? Number(e.target.value) : null)}
                />
                <TextField
                  label="Sono (horas)"
                  inputMode="decimal"
                  value={checkIn.sleepHours == null ? "" : String(checkIn.sleepHours)}
                  onChange={(e) => setCheckIn(selectedDate, { sleepHours: e.target.value ? Math.max(0, Number(e.target.value) || 0) : null })}
                />
                <TextField
                  label="Treino (0/1)"
                  inputMode="numeric"
                  value={checkIn.training ? "1" : "0"}
                  onChange={(e) => setCheckIn(selectedDate, { training: e.target.value.trim() === "1" })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Humor (1–5)"
                  inputMode="numeric"
                  value={checkIn.mood == null ? "" : String(checkIn.mood)}
                  onChange={(e) => {
                    const v = e.target.value ? (Math.max(1, Math.min(5, Math.round(Number(e.target.value) || 1))) as MoodScore) : null;
                    setCheckIn(selectedDate, { mood: v });
                  }}
                />
                <TextField
                  label="Fome (1–5)"
                  inputMode="numeric"
                  value={checkIn.hunger == null ? "" : String(checkIn.hunger)}
                  onChange={(e) => {
                    const v = e.target.value ? (Math.max(1, Math.min(5, Math.round(Number(e.target.value) || 1))) as MoodScore) : null;
                    setCheckIn(selectedDate, { hunger: v });
                  }}
                />
              </div>
              <TextField label="Notas (opcional)" value={checkIn.notes} onChange={(e) => setCheckIn(selectedDate, { notes: e.target.value })} />
            </div>
          </div>

          <div className="rounded-2xl bg-card/80 p-5 ring-1 ring-border shadow-crisp">
            <div className="flex items-center justify-between gap-3">
              <div className="font-display text-lg tracking-tight text-fg">Rótulo (rápido)</div>
              <div className="text-xs text-muted">alerta açúcar/sódio</div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Produto" placeholder="Ex.: iogurte" value={labelProduct} onChange={(e) => setLabelProduct(e.target.value)} />
                <TextField label="Porção" placeholder="Ex.: 170g" value={labelServing} onChange={(e) => setLabelServing(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField label="Calorias (kcal)" inputMode="numeric" value={labelCalories} onChange={(e) => setLabelCalories(e.target.value)} />
                <TextField label="Açúcar (g)" inputMode="decimal" value={labelSugar} onChange={(e) => setLabelSugar(e.target.value)} />
                <TextField label="Sódio (mg)" inputMode="numeric" value={labelSodium} onChange={(e) => setLabelSodium(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!labelProduct.trim()) return;
                    addLabelScan({
                      dateISO: selectedDate,
                      product: labelProduct.trim(),
                      serving: labelServing.trim(),
                      caloriesKcal: labelCalories ? Math.max(0, Math.round(Number(labelCalories) || 0)) : null,
                      sugarG: Math.max(0, Number(labelSugar) || 0),
                      sodiumMg: Math.max(0, Math.round(Number(labelSodium) || 0)),
                    });
                    setLabelProduct("");
                    setLabelServing("");
                    setLabelCalories("");
                    setLabelSugar("");
                    setLabelSodium("");
                  }}
                  disabled={!labelProduct.trim()}
                >
                  Salvar
                </Button>
              </div>
            </div>

            {labelScans.length > 0 && (
              <div className="mt-4 grid gap-2">
                {labelScans.map((s) => {
                  const flags = [
                    s.sugarG >= 10 ? "Açúcar alto" : null,
                    s.sodiumMg >= 400 ? "Sódio alto" : null,
                  ].filter(Boolean) as string[];
                  return (
                    <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl bg-card-2/45 p-3 ring-1 ring-border">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-fg">
                          {s.product} {s.serving ? `· ${s.serving}` : ""}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {s.caloriesKcal != null ? `${s.caloriesKcal}kcal · ` : ""}
                          Açúcar {s.sugarG}g · Sódio {s.sodiumMg}mg
                        </div>
                        {flags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {flags.map((f) => (
                              <Badge key={f} tone="accent2">
                                {f}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeLabelScan(selectedDate, s.id)}>
                        Remover
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
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

