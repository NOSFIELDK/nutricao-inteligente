import * as React from "react";

import { RecommendationCard } from "@/components/RecommendationCard";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/TextField";
import { foods } from "@/data/catalog";
import type { CatalogItem, MealSlot, Recommendation } from "@/domain/models";
import { useAppStore } from "@/store/useAppStore";
import { addDaysISO, mealSlotLabel, todayISO } from "@/utils/date";

export default function FoodsPage() {
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const addToPlan = useAppStore((s) => s.addToPlan);

  const [selected, setSelected] = React.useState<CatalogItem | null>(null);
  const [dateISO, setDateISO] = React.useState(todayISO());
  const [mealSlot, setMealSlot] = React.useState<MealSlot>("lanche");

  const list: Recommendation[] = foods.map((f) => ({ item: f, score: 1, reasons: f.tags.slice(0, 3).map((t) => ({ tag: t, label: t })) }));

  const openAdd = (item: CatalogItem) => {
    setSelected(item);
    setDateISO(todayISO());
    setMealSlot("lanche");
  };

  const commitAdd = () => {
    if (!selected) return;
    addToPlan({ item: selected, dateISO, mealSlot, servings: 1 });
    setSelected(null);
  };

  return (
    <div className="grid gap-6">
      <div>
        <div className="font-display text-2xl tracking-tight text-fg">Provisões de Batalha</div>
        <div className="mt-1 text-sm text-muted">Combinações aprovadas pelo conselho Viking para máxima energia em combate.</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((rec, idx) => (
          <RecommendationCard
            key={rec.item.id}
            rec={rec}
            isFavorite={isFavorite(rec.item)}
            onToggleFavorite={() => toggleFavorite(rec.item)}
            onAddToPlan={() => openAdd(rec.item)}
            compact
            animationDelay={Math.min(idx * 55, 400)}
          />
        ))}
      </div>

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
              <button
                onClick={() => setSelected(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-card-2 px-4 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card active:translate-y-px active:shadow-none"
              >
                Cancelar
              </button>
              <button
                onClick={commitAdd}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-fg shadow-crisp transition hover:brightness-[1.02] active:translate-y-px active:shadow-none"
              >
                Adicionar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

