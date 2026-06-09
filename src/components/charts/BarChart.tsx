import * as React from "react";

export type BarPoint = { label: string; value: number };

/**
 * Gráfico de barras minimalista em SVG puro. Opcionalmente desenha uma linha de
 * meta (`target`); barras que atingem a meta ganham destaque.
 */
export function BarChart({
  data,
  target,
  unit = "",
  height = 120,
}: {
  data: BarPoint[];
  target?: number;
  unit?: string;
  height?: number;
}) {
  const W = 320;
  const H = height;
  const padTop = 12;
  const padBottom = 16;
  const plotH = H - padTop - padBottom;

  const max = Math.max(target ?? 0, ...data.map((d) => d.value), 1);
  const n = Math.max(1, data.length);
  const gap = n > 14 ? 2 : 4;
  const bw = (W - gap * (n + 1)) / n;
  const barH = (v: number) => (Math.max(0, v) / max) * plotH;
  const targetY = target ? padTop + plotH * (1 - Math.min(1, target / max)) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de barras">
      {data.map((d, i) => {
        const h = barH(d.value);
        const xpos = gap + i * (bw + gap);
        const ypos = padTop + plotH - h;
        const meets = target ? d.value >= target : false;
        return (
          <rect
            key={i}
            x={xpos}
            y={ypos}
            width={bw}
            height={Math.max(0, h)}
            rx={Math.min(2, bw / 2)}
            className={meets ? "fill-accent" : "fill-accent/45"}
          />
        );
      })}
      {targetY != null ? (
        <>
          <line x1={0} y1={targetY} x2={W} y2={targetY} className="stroke-fg/40" strokeWidth={1} strokeDasharray="3 3" />
          <text x={W - 2} y={targetY - 3} textAnchor="end" className="fill-muted" fontSize={9}>
            meta {target}
            {unit}
          </text>
        </>
      ) : null}
    </svg>
  );
}
