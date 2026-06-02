import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/TextField";
import { catalog } from "@/data/catalog";
import { getItem, itemTitle } from "@/domain/catalog";
import type { CatalogItem, MealSlot, PlanItem, Recommendation } from "@/domain/models";
import { recommendCatalog } from "@/domain/recommend/recommend";
import { useAppStore } from "@/store/useAppStore";
import { addDaysISO, mealSlotLabel, todayISO } from "@/utils/date";

const slots: MealSlot[] = ["cafe", "almoco", "lanche", "jantar"];

function weekRange() {
  const start = todayISO();
  const end = addDaysISO(start, 6);
  return { start, end };
}

function slotOrder(slot: MealSlot) {
  return slots.indexOf(slot);
}

export default function PlanPage() {
  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const favorites = useAppStore((s) => s.favorites);
  const addToPlan = useAppStore((s) => s.addToPlan);
  const removeFromPlan = useAppStore((s) => s.removeFromPlan);
  const setPlanItemServings = useAppStore((s) => s.setPlanItemServings);
  const clearPlan = useAppStore((s) => s.clearPlan);

  const { start, end } = weekRange();

  const [open, setOpen] = React.useState(false);
  const [favId, setFavId] = React.useState<string>("");
  const [dateISO, setDateISO] = React.useState(start);
  const [mealSlot, setMealSlot] = React.useState<MealSlot>("almoco");

  const favoriteItems: CatalogItem[] = favorites
    .map((f) => getItem(catalog, { type: f.itemType, id: f.itemId }))
    .filter((x): x is CatalogItem => !!x);

  React.useEffect(() => {
    if (!favId && favoriteItems[0]) setFavId(favoriteItems[0].id);
  }, [favId, favoriteItems]);

  const weekDays = React.useMemo(() => Array.from({ length: 7 }).map((_, i) => addDaysISO(start, i)), [start]);

  const byDate = React.useMemo(() => {
    const map = new Map<string, PlanItem[]>();
    for (const d of weekDays) map.set(d, []);
    for (const p of plan) {
      if (!map.has(p.dateISO)) continue;
      map.get(p.dateISO)!.push(p);
    }
    for (const [k, v] of map) v.sort((a, b) => slotOrder(a.mealSlot) - slotOrder(b.mealSlot));
    return map;
  }, [plan, weekDays]);

  const generateWeek = () => {
    if (!profile) return;
    const recs: Recommendation[] = recommendCatalog(profile, catalog, 30).filter((r) => r.item.type === "recipe");
    const picks = recs.slice(0, 14).map((r) => r.item);
    if (picks.length === 0) return;

    clearPlan();
    let idx = 0;
    for (const d of weekDays) {
      const lunch = picks[idx % picks.length];
      idx += 1;
      const dinner = picks[idx % picks.length];
      idx += 1;
      addToPlan({ item: lunch, dateISO: d, mealSlot: "almoco", servings: 1 });
      addToPlan({ item: dinner, dateISO: d, mealSlot: "jantar", servings: 1 });
    }
  };

  const openAddFavorite = () => {
    if (favoriteItems.length === 0) return;
    setOpen(true);
    setDateISO(start);
    setMealSlot("almoco");
    setFavId(favoriteItems[0].id);
  };

  const commitFavorite = () => {
    const item = favoriteItems.find((i) => i.id === favId);
    if (!item) return;
    addToPlan({ item, dateISO, mealSlot, servings: 1 });
    setOpen(false);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight text-fg">Plano semanal</div>
          <div className="mt-1 text-sm text-muted">
            Semana atual: {start} → {end}. Monte o plano para gerar a lista de compras.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={openAddFavorite}
            disabled={favoriteItems.length === 0}
            title={favoriteItems.length === 0 ? "Favorite itens no Painel ou Receitas para adicioná-los aqui" : undefined}
          >
            Adicionar favorito
          </Button>
          <Button
            variant="secondary"
            onClick={generateWeek}
            disabled={!profile}
            title={!profile ? "Crie seu perfil primeiro para gerar uma semana automática" : undefined}
          >
            Gerar semana
          </Button>
          <Button variant="danger" onClick={clearPlan} disabled={plan.length === 0}>
            Limpar
          </Button>
        </div>
      </div>

      {!profile && (
        <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp animate-fade-up flex items-center justify-between gap-4">
          <div className="text-sm text-muted">Crie seu perfil para desbloquear "Gerar semana" e recomendações personalizadas.</div>
          <Link to="/perfil" className="shrink-0 inline-flex h-9 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-fg shadow-crisp transition hover:brightness-[1.02]">
            Criar perfil
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {weekDays.map((d, idx) => {
          const items = byDate.get(d) ?? [];
          const isToday = d === start;
          return (
            <div
              key={d}
              className={[
                "rounded-2xl ring-1 shadow-crisp animate-fade-up transition",
                isToday ? "bg-accent/8 ring-accent/25" : "bg-card/85 ring-border",
              ].join(" ")}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="font-display text-lg tracking-tight text-fg">{d}</div>
                  {isToday && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-fg ring-1 ring-accent/30">
                      hoje
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted">{items.length} item(ns)</div>
              </div>
              <div className="grid gap-3 p-4">
                {slots.map((slot) => {
                  const slotItems = items.filter((p) => p.mealSlot === slot);
                  return (
                    <div key={slot} className="grid gap-2 rounded-xl bg-card-2/45 p-3 ring-1 ring-border">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-medium text-fg/90">{mealSlotLabel(slot)}</div>
                        <div className="text-[11px] text-muted">{slotItems.length} item(ns)</div>
                      </div>
                      {slotItems.length === 0 ? (
                        <div className="text-sm text-muted">Sem itens.</div>
                      ) : (
                        <div className="grid gap-2">
                          {slotItems.map((p) => {
                            const item = getItem(catalog, { type: p.itemType, id: p.itemId });
                            return (
                              <div key={p.id} className="flex flex-col gap-2 rounded-xl bg-card/70 p-3 ring-1 ring-border">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate font-medium text-fg">{item ? itemTitle(item) : "Item"}</div>
                                    <div className="mt-0.5 text-xs text-muted">{p.itemType}</div>
                                  </div>
                                  <button
                                    onClick={() => removeFromPlan(p.id)}
                                    className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-card-2 hover:text-fg"
                                  >
                                    Remover
                                  </button>
                                </div>
                                <div className="grid grid-cols-[1fr_120px] items-end gap-3">
                                  <TextField
                                    label="Porções"
                                    inputMode="numeric"
                                    value={p.servings}
                                    onChange={(e) => setPlanItemServings(p.id, Number(e.target.value))}
                                  />
                                  <div className="text-xs text-muted">Use 1 como base</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} title="Adicionar favorito ao plano" onClose={() => setOpen(false)}>
        <div className="grid gap-4">
          <SelectField label="Favorito" value={favId} onChange={(e) => setFavId(e.target.value)}>
            {favoriteItems.map((i) => (
              <option key={i.id} value={i.id}>
                {itemTitle(i)}
              </option>
            ))}
          </SelectField>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Dia" value={dateISO} onChange={(e) => setDateISO(e.target.value)}>
              {weekDays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectField>
            <SelectField label="Refeição" value={mealSlot} onChange={(e) => setMealSlot(e.target.value as MealSlot)}>
              {slots.map((s) => (
                <option key={s} value={s}>
                  {mealSlotLabel(s)}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={commitFavorite}>Adicionar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

