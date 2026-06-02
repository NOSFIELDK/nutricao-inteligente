import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Badge, Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { recipes } from "@/data/catalog";
import type { CatalogTag, Recipe } from "@/domain/models";
import { useAppStore } from "@/store/useAppStore";

const quickFilters: { tag: CatalogTag; label: string }[] = [
  { tag: "highProtein", label: "Proteína" },
  { tag: "highFiber", label: "Fibras" },
  { tag: "lowGI", label: "Baixo IG" },
  { tag: "lowSodium", label: "Baixo sódio" },
  { tag: "lactoseFree", label: "Sem lactose" },
  { tag: "glutenFree", label: "Sem glúten" },
  { tag: "lowCarb", label: "Low carb" },
];

function matchesSearch(r: Recipe, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    r.title.toLowerCase().includes(s) ||
    r.ingredients.some((i) => i.toLowerCase().includes(s)) ||
    r.tags.some((t) => t.toLowerCase().includes(s))
  );
}

export default function RecipesPage() {
  const [q, setQ] = React.useState("");
  const [tag, setTag] = React.useState<CatalogTag | null>(null);

  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);

  const list = React.useMemo(() => {
    return recipes
      .filter((r) => matchesSearch(r, q))
      .filter((r) => (tag ? r.tags.includes(tag) : true))
      .sort((a, b) => b.proteinG - a.proteinG);
  }, [q, tag]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight text-fg">Receitas</div>
          <div className="mt-1 text-sm text-muted">Busca por ingredientes, objetivo e tags.</div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card/75 p-4 ring-1 ring-border shadow-crisp">
        <TextField
          label="Buscar"
          placeholder="Ex.: frango, low carb, fibras..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Chip active={!tag} onClick={() => setTag(null)} type="button">
            Todas
          </Chip>
          {quickFilters.map((f) => (
            <Chip key={f.tag} active={tag === f.tag} onClick={() => setTag((prev) => (prev === f.tag ? null : f.tag))} type="button">
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r, idx) => (
          <div
            key={r.id}
            className="group overflow-hidden rounded-2xl bg-card/85 ring-1 ring-border shadow-crisp transition hover:-translate-y-0.5 hover:shadow-soft animate-fade-up"
            style={{ animationDelay: `${Math.min(idx * 55, 400)}ms` }}
          >
            <Link to={`/receitas/${r.id}`} className="block">
              <div className="relative h-40 overflow-hidden ring-1 ring-border">
                <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
              </div>
              <div className="p-4">
                <div className="font-display text-lg tracking-tight text-fg">{r.title}</div>
                <div className="mt-1 text-sm text-muted">{r.prepMinutes} min · {r.proteinG}g proteína</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.tags.slice(0, 3).map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </div>
            </Link>
            <div className="flex items-center justify-between gap-2 px-4 pb-4">
              <Button variant="secondary" size="sm" onClick={() => toggleFavorite(r)}>
                {isFavorite(r) ? "Remover favorito" : "Favoritar"}
              </Button>
              <Link to={`/receitas/${r.id}`} className="text-xs font-medium text-muted transition hover:text-fg">
                Ver detalhe
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

