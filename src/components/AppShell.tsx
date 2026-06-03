import { Apple, BarChart3, CalendarDays, Dumbbell, Info, LayoutDashboard, Settings, ShoppingBasket, Sparkles, UtensilsCrossed } from "lucide-react";
import * as React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

type NavItem = {
  to: string;
  label: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const nav: NavItem[] = [
  { to: "/painel",       label: "Salão",      subtitle: "Painel",       Icon: LayoutDashboard },
  { to: "/historico",    label: "Crônicas",   subtitle: "Histórico",    Icon: BarChart3 },
  { to: "/receitas",     label: "Festim",     subtitle: "Receitas",     Icon: UtensilsCrossed },
  { to: "/alimentos",    label: "Provisões",  subtitle: "Alimentos",    Icon: Apple },
  { to: "/suplementos",  label: "Poções",     subtitle: "Suplementos",  Icon: Dumbbell },
  { to: "/plano",        label: "Conquista",  subtitle: "Plano",        Icon: CalendarDays },
  { to: "/compras",      label: "Saque",      subtitle: "Compras",      Icon: ShoppingBasket },
  { to: "/insights",     label: "Runas",      subtitle: "Insights",     Icon: Sparkles },
  { to: "/configuracoes",label: "Forja",      subtitle: "Ajustes",      Icon: Settings },
  { to: "/sobre",        label: "Código",     subtitle: "Sobre",        Icon: Info },
];

const VIKING_QUOTES = [
  "A força de um guerreiro vem do que ele come e de como ele treina.",
  "Forje seu corpo como um ferreiro forja uma espada — com fogo e disciplina.",
  "Odin sabia: sem nutrição, não há conquista.",
  "Vikings não descansam até a batalha estar vencida. Nem sua alimentação.",
  "Um guerreiro saudável conquista mais territórios. Cuide do seu templo.",
  "A mesa do festim é sagrada. Escolha bem o que coloca nela.",
  "Não há glória sem sacrifício. Não há vitória sem preparo.",
  "Thor é forte porque come forte. Você também pode.",
];

function useVikingQuote() {
  return React.useMemo(() => VIKING_QUOTES[Math.floor(Math.random() * VIKING_QUOTES.length)], []);
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/nutricao-inteligente/logo.png"
        alt="LeifNutri"
        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
        loading="eager"
      />
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

function NavItemLink({ to, label, subtitle, Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 ring-1 transition-all duration-150",
          isActive
            ? "bg-accent/16 text-fg ring-accent/30 shadow-[0_0_0_1px_hsl(var(--accent)/0.18),inset_0_1px_0_hsl(var(--accent)/0.12)]"
            : "bg-transparent text-muted ring-transparent hover:bg-card-2/70 hover:text-fg hover:ring-border/80",
        )
      }
    >
      <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-150", "group-hover:scale-110")} />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium leading-tight">{label}</div>
        <div className="truncate text-[10px] leading-tight opacity-50">{subtitle}</div>
      </div>
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

function VikingQuoteCard() {
  const quote = useVikingQuote();
  return (
    <div className="rounded-2xl bg-accent/8 p-4 ring-1 ring-accent/20 shadow-crisp">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-base">⚔️</span>
        <span className="font-display text-xs font-bold tracking-wide text-accent">Palavra do Guerreiro</span>
      </div>
      <p className="text-xs leading-relaxed text-muted italic">"{quote}"</p>
    </div>
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
          <VikingQuoteCard />
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
