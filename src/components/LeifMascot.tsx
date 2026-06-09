import * as React from "react";

import { cn } from "@/lib/utils";

type LeifMascotVariant = "avatar" | "full";

export function LeifMascot({
  variant = "avatar",
  className,
  title = "Leif",
}: {
  variant?: LeifMascotVariant;
  className?: string;
  title?: string;
}) {
  const isFull = variant === "full";
  const viewBox = isFull ? "0 0 220 260" : "0 0 220 220";

  const fg = "hsl(var(--fg))";
  const muted = "hsl(var(--muted))";
  const border = "hsl(var(--border))";
  const card = "hsl(var(--card))";
  const card2 = "hsl(var(--card-2))";

  const gold = "hsl(var(--gold))";
  const goldSoft = "hsl(var(--gold) / 0.35)";
  const accent = "hsl(var(--accent))";
  const accentSoft = "hsl(var(--accent) / 0.35)";
  const blue = "hsl(var(--viking-blue))";
  const blueSoft = "hsl(var(--viking-blue) / 0.25)";
  const rust = "hsl(var(--rust))";
  const bone = "hsl(var(--bone))";

  return (
    <svg viewBox={viewBox} className={cn("block", className)} role="img" aria-label={title}>
      <title>{title}</title>

      <defs>
        <linearGradient id="leif_helm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={card2} />
          <stop offset="45%" stopColor={goldSoft} />
          <stop offset="100%" stopColor={card} />
        </linearGradient>
        <linearGradient id="leif_cloak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentSoft} />
          <stop offset="55%" stopColor={blueSoft} />
          <stop offset="100%" stopColor={"hsl(var(--bg) / 0.2)"} />
        </linearGradient>
        <radialGradient id="leif_face" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={bone} stopOpacity="0.95" />
          <stop offset="70%" stopColor={bone} stopOpacity="0.68" />
          <stop offset="100%" stopColor={card2} stopOpacity="0.35" />
        </radialGradient>
      </defs>

      <g stroke={border} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        {isFull ? (
          <>
            <path d="M 52 120 Q 110 88 168 120 Q 180 180 150 236 Q 110 255 70 236 Q 40 182 52 120 Z" fill="url(#leif_cloak)" />
            <path d="M 78 156 Q 110 140 142 156 Q 150 198 138 230 Q 110 242 82 230 Q 70 198 78 156 Z" fill={card} />
            <path d="M 84 178 Q 110 165 136 178" fill="none" stroke={border} />
            <rect x={92} y={206} width={36} height={12} rx={6} fill={rust} stroke={border} />
            <circle cx={110} cy={212} r={3} fill={gold} stroke="none" />

            <path d="M 64 168 Q 54 160 54 146 Q 58 134 72 132 Q 86 134 90 148 Q 90 160 82 168" fill={card2} />
            <path d="M 156 168 Q 166 160 166 146 Q 162 134 148 132 Q 134 134 130 148 Q 130 160 138 168" fill={card2} />
            <path d="M 54 148 Q 44 156 42 168 Q 40 182 48 188 Q 56 192 64 186" fill={card2} />
            <path d="M 166 148 Q 176 156 178 168 Q 180 182 172 188 Q 164 192 156 186" fill={card2} />

            <path d="M 74 236 Q 92 230 110 230 Q 128 230 146 236 Q 144 252 130 256 Q 110 260 90 256 Q 76 252 74 236 Z" fill={card2} />
            <path d="M 84 236 Q 92 244 92 256" fill="none" stroke={border} />
            <path d="M 136 236 Q 128 244 128 256" fill="none" stroke={border} />

            <path d="M 150 170 Q 172 168 182 184 Q 166 198 142 196" fill={card2} />
            <path d="M 142 186 Q 156 180 166 186" fill="none" stroke={border} />
            <path d="M 162 178 Q 160 168 166 160 Q 176 166 178 176 Q 176 186 166 190" fill={accent} stroke={border} />

            <path d="M 44 176 Q 62 160 82 170 Q 76 196 54 202 Q 40 196 44 176 Z" fill={card2} />
            <path d="M 56 178 Q 62 174 68 178" fill="none" stroke={border} />
          </>
        ) : null}

        <path d="M 62 56 Q 110 20 158 56 Q 162 98 148 116 Q 110 140 72 116 Q 58 98 62 56 Z" fill="url(#leif_face)" />
        <path d="M 62 56 Q 110 36 158 56 Q 156 36 140 26 Q 110 16 80 26 Q 64 36 62 56 Z" fill="url(#leif_helm)" />
        <path d="M 78 28 Q 70 18 58 18 Q 46 18 44 32 Q 46 48 64 46 Q 78 44 78 28 Z" fill={card2} />
        <path d="M 142 28 Q 150 18 162 18 Q 174 18 176 32 Q 174 48 156 46 Q 142 44 142 28 Z" fill={card2} />
        <path d="M 86 56 Q 98 48 110 56" fill="none" stroke={border} />

        <circle cx={94} cy={76} r={5} fill={fg} stroke="none" />
        <circle cx={126} cy={76} r={5} fill={fg} stroke="none" />
        <path d="M 102 98 Q 110 104 118 98" fill="none" stroke={muted} strokeWidth={3} />

        <path d="M 70 112 Q 110 142 150 112 Q 146 160 110 170 Q 74 160 70 112 Z" fill={rust} stroke={border} />
        <path d="M 84 124 Q 110 140 136 124" fill="none" stroke={border} />
        <path d="M 90 154 Q 110 160 130 154" fill="none" stroke={border} />

        <path d="M 80 112 Q 70 108 66 96 Q 66 84 80 82" fill="none" stroke={border} />
        <path d="M 140 112 Q 150 108 154 96 Q 154 84 140 82" fill="none" stroke={border} />
        <path d="M 110 54 Q 110 44 110 36" fill="none" stroke={border} />
        <circle cx={110} cy={34} r={3.5} fill={gold} stroke={border} />
      </g>
    </svg>
  );
}

