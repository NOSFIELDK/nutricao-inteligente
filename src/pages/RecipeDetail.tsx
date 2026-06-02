import * as React from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/TextField";
import { recipes } from "@/data/catalog";
import type { MealSlot } from "@/domain/models";
import { useAppStore } from "@/store/useAppStore";
import { addDaysISO, mealSlotLabel, todayISO } from "@/utils/date";

export default function RecipeDetailPage() {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);

  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const addToPlan = useAppStore((s) => s.addToPlan);

  const [open, setOpen] = React.useState(false);
  const [dateISO, setDateISO] = React.useState(todayISO());
  const [mealSlot, setMealSlot] = React.useState<MealSlot>("almoco");

  if (!recipe) {
    return (
      <div className="rounded-2xl bg-card/80 p-6 ring-1 ring-border shadow-crisp">
        <div className="font-display text-xl tracking-tight text-fg">Receita não encontrada</div>
        <div className="mt-3">
          <Link to="/receitas" className="text-sm font-medium text-accent">
            Voltar para receitas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/receitas" className="text-sm font-medium text-muted hover:text-fg">
          ← Voltar
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => toggleFavorite(recipe)}>
            {isFavorite(recipe) ? "Remover favorito" : "Favoritar"}
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            Adicionar ao plano
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card/85 ring-1 ring-border shadow-soft">
        <div className="relative h-56 overflow-hidden">
          <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="font-display text-2xl tracking-tight text-white">{recipe.title}</div>
            <div className="mt-1 text-sm text-white/80">{recipe.prepMinutes} min · {recipe.servings} porção(ões)</div>
          </div>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4">
            <div>
              <div className="text-xs font-medium text-muted">Ingredientes</div>
              <ul className="mt-2 grid gap-2 text-sm text-fg/90">
                {recipe.ingredients.map((i, idx) => (
                  <li key={idx} className="rounded-lg bg-card-2/60 px-3 py-2 ring-1 ring-border/80">
                    {i}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-medium text-muted">Modo de preparo</div>
              <ol className="mt-2 grid gap-2 text-sm text-fg/90">
                {recipe.steps.map((s, idx) => (
                  <li key={idx} className="rounded-lg bg-card-2/60 px-3 py-2 ring-1 ring-border/80">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/18 text-xs font-semibold text-fg ring-1 ring-accent/22">
                      {idx + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            {recipe.ingredientNotes && recipe.ingredientNotes.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted">Benefícios dos ingredientes</div>
                <div className="mt-2 grid gap-2 text-sm">
                  {recipe.ingredientNotes.map((note, idx) => (
                    <div key={idx} className="rounded-lg bg-accent/8 px-3 py-2 ring-1 ring-accent/15">
                      <span className="font-medium text-fg">{note.ingredient}</span>
                      <span className="text-fg/70"> — {note.benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 self-start rounded-2xl bg-card-2/45 p-4 ring-1 ring-border">
            <div className="font-display text-lg tracking-tight text-fg">Macros (estimativa)</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-card/70 p-3 ring-1 ring-border">
                <div className="text-xs text-muted">Proteína</div>
                <div className="mt-1 font-semibold text-fg">{recipe.proteinG}g</div>
              </div>
              <div className="rounded-xl bg-card/70 p-3 ring-1 ring-border">
                <div className="text-xs text-muted">Carbo</div>
                <div className="mt-1 font-semibold text-fg">{recipe.carbsG}g</div>
              </div>
              <div className="rounded-xl bg-card/70 p-3 ring-1 ring-border">
                <div className="text-xs text-muted">Gordura</div>
                <div className="mt-1 font-semibold text-fg">{recipe.fatG}g</div>
              </div>
              <div className="rounded-xl bg-card/70 p-3 ring-1 ring-border">
                <div className="text-xs text-muted">Fibras</div>
                <div className="mt-1 font-semibold text-fg">{recipe.fiberG}g</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {recipe.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={open} title="Adicionar ao plano" onClose={() => setOpen(false)}>
        <div className="grid gap-4">
          <div className="text-sm text-muted">{recipe.title}</div>
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
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                addToPlan({ item: recipe, dateISO, mealSlot, servings: 1 });
                setOpen(false);
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

