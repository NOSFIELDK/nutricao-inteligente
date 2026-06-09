import * as React from "react";

export type LinePoint = { label: string; value: number | null };

/**
 * Gráfico de linha minimalista em SVG puro (sem libs). Escala automática ao
 * intervalo dos dados, com área preenchida e destaque no último ponto.
 * Pontos nulos são ignorados (a linha conecta os valores existentes).
 */
export function LineChart({ data, unit = "", height = 120 }: { data: LinePoint[]; unit?: string; height?: number }) {
  const W = 320;
  const H = height;
  const padX = 8;
  const padY = 12;
  const gradientId = React.useId();

  const present = data.map((d, i) => ({ i, value: d.value })).filter((d): d is { i: number; value: number } => d.value != null);

  if (present.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-xl bg-card-2/40 text-xs text-muted ring-1 ring-border">
        Sem dados ainda
      </div>
    );
  }

  const vals = present.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const stepX = data.length > 1 ? (W - padX * 2) / (data.length - 1) : 0;
  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => padY + (H - padY * 2) * (1 - (v - min) / span);

  const linePath = present.map((p, idx) => `${idx === 0 ? "M" : "L"} ${x(p.i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const first = present[0];
  const last = present[present.length - 1];
  const areaPath = `${linePath} L ${x(last.i).toFixed(1)} ${(H - padY).toFixed(1)} L ${x(first.i).toFixed(1)} ${(H - padY).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de linha">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="[stop-color:hsl(var(--accent))]" stopOpacity="0.28" />
          <stop offset="100%" className="[stop-color:hsl(var(--accent))]" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {present.map((p) => (
        <circle key={p.i} cx={x(p.i)} cy={y(p.value)} r={p === last ? 3.5 : 2} className="fill-accent" />
      ))}
      <text x={padX} y={y(max) - 4} className="fill-muted" fontSize={9}>
        {max}
        {unit}
      </text>
      <text x={padX} y={y(min) + 10} className="fill-muted" fontSize={9}>
        {min}
        {unit}
      </text>
    </svg>
  );
}
