import { Apple, CalendarDays, Dumbbell, LayoutDashboard, Settings, ShoppingBasket, Sparkles, UtensilsCrossed } from "lucide-react";
import * as React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

type NavItem = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const nav: NavItem[] = [
  { to: "/painel", label: "Painel", Icon: LayoutDashboard },
  { to: "/receitas", label: "Receitas", Icon: UtensilsCrossed },
  { to: "/alimentos", label: "Alimentos", Icon: Apple },
  { to: "/suplementos", label: "Suplementos", Icon: Dumbbell },
  { to: "/plano", label: "Plano", Icon: CalendarDays },
  { to: "/compras", label: "Compras", Icon: ShoppingBasket },
  { to: "/insights", label: "Insights", Icon: Sparkles },
  { to: "/configuracoes", label: "Ajustes", Icon: Settings },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      {/* overflow-hidden no container é o corte definitivo — sem borda branca */}
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-accent/50 shadow-crisp">
        <img
          src="/nutricao-inteligente/logo.png"
          alt="LeifNutri"
          className="h-full w-full scale-[1.08] object-cover"
          loading="eager"
        />
      </div>
      <div className="leading-none">
        <div className="font-display text-sm font-black tracking-wide">
          <span className="text-fg">Leif</span><span className="text-accent">Nutri</span>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-lg bg-card-2/70 px-3 py-2 text-xs font-medium text-fg ring-1 ring-border transition hover:bg-card-2"
    >
      {isDark ? "Modo claro" : "Modo escuro"}
    </button>
  );
}

function NavItemLink({ to, label, Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm ring-1 transition-all duration-150",
          isActive
            ? "bg-accent/16 text-fg ring-accent/30 shadow-[0_0_0_1px_hsl(var(--accent)/0.18),inset_0_1px_0_hsl(var(--accent)/0.12)]"
            : "bg-transparent text-muted ring-transparent hover:bg-card-2/70 hover:text-fg hover:ring-border/80",
        )
      }
    >
      <Icon className={cn("h-4 w-4 transition-transform duration-150", "group-hover:scale-110")} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function BottomItemLink({ to, label, Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition",
          isActive ? "bg-accent/16 text-fg" : "text-muted hover:bg-card-2/70 hover:text-fg",
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-full">
      <div className="mx-auto grid max-w-[1220px] grid-cols-1 gap-6 px-4 pb-24 pt-6 md:grid-cols-[260px_1fr] md:pb-10">
        <aside className="hidden md:flex md:flex-col md:gap-4">
          <div className="flex items-center justify-between gap-3">
            <Brand />
            <ThemeToggle />
          </div>
          <div className="rounded-2xl bg-card/70 ring-1 ring-border shadow-crisp">
            <div className="flex flex-col gap-1 p-2">
              {nav.map((item) => (
                <NavItemLink key={item.to} {...item} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-accent/8 p-4 text-xs text-muted ring-1 ring-accent/20 shadow-crisp">
            <div className="font-display text-xs font-bold tracking-wide text-accent">Dica do Guerreiro</div>
            <div className="mt-1 leading-relaxed">
              Use o Plano Semanal para gerar sua lista de compras automaticamente e manter consistência nos macros.
            </div>
          </div>
        </aside>
        <main key={pathname} className="min-w-0 animate-page-in">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="mx-auto max-w-[900px] px-4 pb-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-card/90 p-2 ring-1 ring-border shadow-soft backdrop-blur-md">
            <div className="flex items-center gap-2 pl-1">
              <Brand />
            </div>
            <div className="flex flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {nav.map((item) => (
                <div key={item.to} className="min-w-[72px]">
                  <BottomItemLink {...item} />
                </div>
              ))}
            </div>
            <div className="pr-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
