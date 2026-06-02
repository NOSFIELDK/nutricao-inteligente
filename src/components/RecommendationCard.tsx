import { Apple, Dumbbell, HeartPulse, Star, UtensilsCrossed } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";
import type { CatalogItem, Recommendation } from "@/domain/models";

function IconFor(item: CatalogItem) {
  if (item.type === "recipe") return UtensilsCrossed;
  if (item.type === "food") return Apple;
  return Dumbbell;
}

export type RecommendationCardProps = {
  rec: Recommendation;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToPlan: () => void;
  compact?: boolean;
  animationDelay?: number;
};

export function RecommendationCard({ rec, isFavorite, onToggleFavorite, onAddToPlan, compact, animationDelay = 0 }: RecommendationCardProps) {
  const item = rec.item;
  const Icon = IconFor(item);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card/85 ring-1 ring-border shadow-crisp transition hover:-translate-y-0.5 hover:shadow-soft animate-fade-up",
        compact ? "p-4" : "p-5",
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {item.type === "recipe" ? (
        <div className={cn("relative mb-4 overflow-hidden rounded-xl ring-1 ring-border", compact ? "h-36" : "h-44")}>
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-[11px] font-medium text-white ring-1 ring-white/15">
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Receita</span>
          </div>
        </div>
      ) : (
        <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-card-2/70 px-3 py-2 text-xs font-medium text-fg ring-1 ring-border">
          <Icon className="h-4 w-4" />
          <span>{item.type === "food" ? "Sugestão rápida" : "Suplemento"}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={cn("font-display tracking-tight text-fg", compact ? "text-base" : "text-lg")}>
            {item.type === "recipe" ? item.title : item.type === "food" ? item.title : item.name}
          </div>
          <div className="mt-1 text-sm text-muted">
            {item.type === "food"
              ? item.context
              : item.type === "supplement"
                ? item.purpose
                : `${item.prepMinutes} min · ${item.servings} porção(ões)`}
          </div>
        </div>

        <button
          aria-label="Favoritar"
          onClick={onToggleFavorite}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl ring-1 transition",
            isFavorite ? "bg-accent/20 ring-accent/30" : "bg-card-2/60 ring-border hover:bg-card-2",
          )}
        >
          <Star className={cn("h-4 w-4", isFavorite ? "fill-accent text-accent" : "text-muted")} />
        </button>
      </div>

      {item.type === "food" ? <div className="mt-3 text-sm leading-relaxed text-fg/90">{item.why}</div> : null}
      {item.type === "supplement" ? (
        <div className="mt-3 text-sm leading-relaxed text-fg/90">{item.howToUse}</div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {rec.reasons.map((r) => (
          <Badge key={r.tag} tone="accent" className="bg-accent/14">
            {r.label}
          </Badge>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-muted">Score {rec.score.toFixed(1)}</div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onAddToPlan}>
            Adicionar ao plano
          </Button>
        </div>
      </div>
    </div>
  );
}

