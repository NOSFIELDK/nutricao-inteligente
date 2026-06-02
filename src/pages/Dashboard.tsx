import * as React from "react";
import { Link } from "react-router-dom";

import { RecommendationCard } from "@/components/RecommendationCard";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/TextField";
import { catalog } from "@/data/catalog";
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

export default function DashboardPage() {
  const profile = useAppStore((s) => s.profile);
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
          <div className="font-display text-2xl tracking-tight text-fg">Recomendações</div>
          <div className="mt-1 max-w-2xl text-sm text-muted">
            Conteúdo sugerido com base no seu objetivo, restrições e preferências. Sempre ajuste para sua rotina.
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
          <div className="font-display text-xl tracking-tight text-fg">Comece pelo perfil</div>
          <div className="mt-2 text-sm text-muted">Em 2 minutos você define objetivo, restrições e preferências.</div>
          <div className="mt-4">
            <Link
              to="/perfil"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-fg shadow-crisp transition hover:brightness-[1.02] active:translate-y-px active:shadow-none"
            >
              Criar perfil
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(["saude", "doencas", "performance"] as Tab[]).map((t) => (
              <Chip key={t} active={tab === t} onClick={() => setTab(t)} type="button">
                {tabLabel(t)}
              </Chip>
            ))}
          </div>

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
