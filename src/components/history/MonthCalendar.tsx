import { ChevronLeft, ChevronRight } from "lucide-react";

export type DayDots = { water: boolean; meta: boolean; checkin: boolean; weight: boolean };

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function MonthCalendar({
  monthAnchor,
  today,
  selectedDate,
  dotsByDate,
  onSelect,
  onPrev,
  onNext,
}: {
  monthAnchor: string; // "YYYY-MM-01"
  today: string;
  selectedDate: string;
  dotsByDate: Map<string, DayDots>;
  onSelect: (dateISO: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [y, m] = monthAnchor.split("-").map(Number);
  const year = y;
  const monthIdx = m - 1;
  const firstWeekday = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border shadow-crisp">
      <div className="flex items-center justify-between">
        <button onClick={onPrev} aria-label="Mês anterior" className="tap rounded-lg p-1.5 text-muted ring-1 ring-border transition hover:bg-card-2 hover:text-fg">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-display text-sm font-bold tracking-wide text-fg">
          {MONTHS[monthIdx]} {year}
        </div>
        <button onClick={onNext} aria-label="Próximo mês" className="tap rounded-lg p-1.5 text-muted ring-1 ring-border transition hover:bg-card-2 hover:text-fg">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={`e${i}`} />;
          const dateISO = iso(year, monthIdx, day);
          const dots = dotsByDate.get(dateISO);
          const isToday = dateISO === today;
          const isSelected = dateISO === selectedDate;
          const isFuture = dateISO > today;
          return (
            <button
              key={dateISO}
              onClick={() => onSelect(dateISO)}
              disabled={isFuture}
              className={[
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-xs transition",
                isSelected
                  ? "bg-accent/20 text-fg ring-1 ring-accent/40"
                  : isToday
                    ? "bg-card-2/60 text-fg ring-1 ring-gold/40"
                    : "text-fg/80 ring-1 ring-transparent hover:bg-card-2/60 hover:ring-border",
                isFuture ? "cursor-default opacity-30" : "",
              ].join(" ")}
            >
              <span className="tabular-nums leading-none">{day}</span>
              <span className="flex h-1.5 items-center gap-0.5">
                <Dot on={dots?.water} className="bg-viking-blue" />
                <Dot on={dots?.meta} className="bg-accent" />
                <Dot on={dots?.checkin} className="bg-gold" />
                <Dot on={dots?.weight} className="bg-rust" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
        <Legend className="bg-viking-blue" label="água" />
        <Legend className="bg-accent" label="meta" />
        <Legend className="bg-gold" label="check-in" />
        <Legend className="bg-rust" label="peso" />
      </div>
    </div>
  );
}

function Dot({ on, className }: { on?: boolean; className: string }) {
  return <span className={`h-1 w-1 rounded-full ${on ? className : "bg-border/50"}`} />;
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
