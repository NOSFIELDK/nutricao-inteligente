import * as React from "react";

import { cn } from "@/lib/utils";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function Sparkline({
  data,
  className,
  strokeClassName = "stroke-accent",
  fillClassName = "fill-accent/15",
  dotClassName = "fill-accent",
}: {
  data: Array<number | null | undefined>;
  className?: string;
  strokeClassName?: string;
  fillClassName?: string;
  dotClassName?: string;
}) {
  const W = 96;
  const H = 28;
  const pad = 2;

  const present = React.useMemo(
    () => data.map((v, i) => ({ i, v: v == null ? null : Number(v) })).filter((p): p is { i: number; v: number } => p.v != null && Number.isFinite(p.v)),
    [data],
  );

  if (present.length < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-7 w-24", className)} role="img" aria-label="Tendência">
        <path d={`M ${pad} ${H / 2} L ${W - pad} ${H / 2}`} className={cn("stroke-fg/20", strokeClassName)} strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  }

  const min = Math.min(...present.map((p) => p.v));
  const max = Math.max(...present.map((p) => p.v));
  const span = max - min || 1;
  const stepX = (W - pad * 2) / (data.length - 1);
  const x = (i: number) => pad + i * stepX;
  const y = (v: number) => pad + (H - pad * 2) * (1 - clamp01((v - min) / span));

  const line = present
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`)
    .join(" ");
  const first = present[0];
  const last = present[present.length - 1];
  const area = `${line} L ${x(last.i).toFixed(1)} ${(H - pad).toFixed(1)} L ${x(first.i).toFixed(1)} ${(H - pad).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-7 w-24", className)} role="img" aria-label="Tendência">
      <path d={area} className={fillClassName} />
      <path d={line} className={strokeClassName} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <circle cx={x(last.i)} cy={y(last.v)} r={2.5} className={dotClassName} />
    </svg>
  );
}
