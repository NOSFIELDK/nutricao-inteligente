import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { catalog } from "@/data/catalog";
import { buildShoppingList } from "@/domain/nutrition/shopping";
import { useAppStore } from "@/store/useAppStore";
import { addDaysISO, todayISO } from "@/utils/date";

export default function ShoppingPage() {
  const plan = useAppStore((s) => s.plan);
  const shoppingChecked = useAppStore((s) => s.shoppingChecked);
  const setShoppingChecked = useAppStore((s) => s.setShoppingChecked);
  const clearShoppingChecked = useAppStore((s) => s.clearShoppingChecked);

  const [marketMode, setMarketMode] = React.useState(false);
  const start = todayISO();
  const end = addDaysISO(start, 6);

  const list = React.useMemo(() => {
    return buildShoppingList({ catalog, plan, startISO: start, endISO: end });
  }, [plan, start, end]);

  const checked_count = list.filter((i) => !!shoppingChecked[i.key]).length;
  const remaining = list.length - checked_count;
  const progressPct = list.length > 0 ? Math.round((checked_count / list.length) * 100) : 0;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight text-fg">Lista de compras</div>
          <div className="mt-1 text-sm text-muted">
            Baseada no plano semanal ({start} → {end}).
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={marketMode} onClick={() => setMarketMode((v) => !v)} type="button">
            Modo mercado
          </Chip>
          <Button variant="secondary" onClick={clearShoppingChecked} disabled={Object.keys(shoppingChecked).length === 0}>
            Limpar marcações
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-card/85 ring-1 ring-border shadow-crisp animate-fade-up">
        <div className="px-5 py-4 border-b border-border/70 grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-fg">
              {remaining > 0 ? `${remaining} item(ns) restantes` : list.length > 0 ? "Tudo comprado! 🎉" : "Lista vazia"}
            </div>
            <div className="text-xs text-muted">{list.length} no total · {progressPct}%</div>
          </div>
          {list.length > 0 && (
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
        <div className="grid gap-2 p-4">
          {list.length === 0 ? (
            <div className="rounded-xl bg-card-2/50 p-4 text-sm text-muted ring-1 ring-border">
              Adicione receitas ao Plano Semanal para gerar sua lista automaticamente.
            </div>
          ) : (
            list.map((i, idx) => {
              const checked = !!shoppingChecked[i.key];
              return (
                <label
                  key={i.key}
                  className={[
                    "flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 ring-1 transition-all duration-200 animate-fade-up",
                    checked ? "bg-card-2/45 ring-border/70" : "bg-card/60 ring-border hover:bg-card-2/60",
                  ].join(" ")}
                  style={{ animationDelay: `${Math.min(idx * 40, 500)}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setShoppingChecked(i.key, e.target.checked)}
                      className="h-5 w-5 accent-[hsl(var(--accent))]"
                    />
                    <div className={marketMode ? "text-base font-medium text-fg" : "text-sm font-medium text-fg"}>
                      <span className={checked ? "line-through opacity-50 transition-opacity" : ""}>{i.label}</span>
                    </div>
                  </div>
                  <div className={marketMode ? "text-sm text-muted" : "text-xs text-muted"}>×{i.count}</div>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
