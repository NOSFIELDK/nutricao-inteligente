import type * as React from "react";

import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/Sparkline";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function MiniProgress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-card-2 ring-1 ring-border">
      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(clamp01(value) * 100)}%` }} />
    </div>
  );
}

export function StatCard({
  icon,
  title,
  value,
  subtitle,
  progress,
  trend,
  tone = "accent",
  className,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  trend?: Array<number | null | undefined>;
  tone?: "accent" | "accent-2" | "gold" | "viking-blue";
  className?: string;
  onClick?: () => void;
}) {
  const toneClasses =
    tone === "accent"
      ? { stroke: "stroke-accent", fill: "fill-accent/14", dot: "fill-accent", icon: "text-accent" }
      : tone === "accent-2"
        ? { stroke: "stroke-accent-2", fill: "fill-accent-2/16", dot: "fill-accent-2", icon: "text-accent-2" }
        : tone === "gold"
          ? { stroke: "stroke-gold", fill: "fill-gold/14", dot: "fill-gold", icon: "text-gold" }
          : { stroke: "stroke-viking-blue", fill: "fill-viking-blue/14", dot: "fill-viking-blue", icon: "text-viking-blue" };

  const Comp = onClick ? "button" : "div";
  const compProps = onClick ? { type: "button" as const, onClick } : {};

  return (
    <Comp
      {...compProps}
      className={cn(
        "group relative rounded-2xl bg-card-2/35 p-4 text-left ring-1 ring-border shadow-crisp transition hover:bg-card-2/55 hover:ring-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted">{title}</div>
          <div className="mt-1 truncate text-xl font-semibold tracking-tight text-fg">{value}</div>
          {subtitle ? <div className="mt-1 text-xs text-muted">{subtitle}</div> : null}
        </div>
        <div
          className={cn(
            "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-card/60 ring-1 ring-border transition group-hover:bg-card",
            toneClasses.icon,
          )}
        >
          {icon}
        </div>
      </div>

      {typeof progress === "number" ? (
        <div className="mt-3 grid gap-2">
          <MiniProgress value={progress} />
        </div>
      ) : null}

      {trend ? (
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[10px] font-medium text-muted">7 dias</div>
          <Sparkline data={trend} strokeClassName={toneClasses.stroke} fillClassName={toneClasses.fill} dotClassName={toneClasses.dot} />
        </div>
      ) : null}
    </Comp>
  );
}

