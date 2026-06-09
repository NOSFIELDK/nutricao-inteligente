import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Badge, Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { hasRemoteApi, searchRemoteRecipes } from "@/api/recipesApi";
import { LeifEmptyState } from "@/components/LeifSays";
import { recipes } from "@/data/catalog";
import type { CatalogTag, Recipe } from "@/domain/models";
import { useAppStore } from "@/store/useAppStore";
import { uid } from "@/utils/id";

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
  const [page, setPage] = React.useState(1);
  const [seed, setSeed] = React.useState(() => uid("seed"));
  const [remote, setRemote] = React.useState<Recipe[]>([]);
  const [remoteTotal, setRemoteTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const cacheRecipes = useAppStore((s) => s.cacheRecipes);

  const useRemote = hasRemoteApi();

  React.useEffect(() => {
    if (!useRemote) return;
    setPage(1);
    setRemote([]);
    setRemoteTotal(0);
    if (!q.trim()) setSeed(uid("seed"));
  }, [q, useRemote]);

  React.useEffect(() => {
    if (!useRemote) return;
    let alive = true;
    setLoading(true);
    setError(null);

    searchRemoteRecipes({ q, page, pageSize: 12, seed })
      .then((res) => {
        if (!alive) return;
        setRemote((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setRemoteTotal(res.total);
        cacheRecipes(res.items);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Falha ao carregar.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cacheRecipes, page, q, seed, useRemote]);

  const list = React.useMemo(() => {
    if (useRemote) return remote;
    return recipes
      .filter((r) => matchesSearch(r, q))
      .filter((r) => (tag ? r.tags.includes(tag) : true))
      .sort((a, b) => b.proteinG - a.proteinG);
  }, [q, remote, tag, useRemote]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight text-fg">Festim Viking</div>
          <div className="mt-1 text-sm text-muted">
            {useRemote ? "Catálogo online (macros estimados)." : "Catálogo local (demo)."}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl bg-card/75 p-4 ring-1 ring-border shadow-crisp">
        <TextField
          label="Buscar"
          placeholder="Ex.: frango, low carb, fibras..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {useRemote && !q.trim() ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSeed(uid("seed"));
                setPage(1);
                setRemote([]);
                setRemoteTotal(0);
              }}
            >
              Novas sugestões
            </Button>
          </div>
        ) : null}
        {!useRemote ? (
          <div className="flex flex-wrap gap-2">
            <Chip active={!tag} onClick={() => setTag(null)} type="button">
              Todas
            </Chip>
            {quickFilters.map((f) => (
              <Chip
                key={f.tag}
                active={tag === f.tag}
                onClick={() => setTag((prev) => (prev === f.tag ? null : f.tag))}
                type="button"
              >
                {f.label}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl bg-card/80 p-4 text-sm text-red-500 ring-1 ring-border shadow-crisp">{error}</div>
      ) : null}

      {!loading && !error && list.length === 0 ? (
        <LeifEmptyState
          mood="warn"
          title="Nenhum festim encontrado"
          message={
            q.trim()
              ? `Não encontrei receitas para "${q.trim()}". Tente outro ingrediente ou filtro, guerreiro.`
              : "Nenhuma receita disponível agora. Volte em breve para o próximo banquete."
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r, idx) => (
          <div
            key={r.id}
            className="group hover-lift ring-hover overflow-hidden rounded-2xl bg-card/85 ring-1 ring-border shadow-crisp animate-fade-up"
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

      {useRemote ? (
        <div className="flex items-center justify-center">
          <Button
            variant="secondary"
            disabled={loading || list.length >= remoteTotal}
            onClick={() => setPage((p) => p + 1)}
          >
            {loading ? "Carregando..." : list.length >= remoteTotal ? "Fim" : "Carregar mais"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

