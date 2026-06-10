import * as React from "react";

import { cn } from "@/lib/utils";

export type LeifMood = "normal" | "motivate" | "warn" | "celebrate" | "sad" | "sleep";
export type LeifPose = "idle" | "hero";
export type LeifItem = "axe" | "shield";
type LeifMascotVariant = "avatar" | "full";
type LeifMascotStyle = "crafted" | "blocky";

/**
 * Leif — mascote vetorial "Runic Craft".
 * Volumes modulares, paleta-material da logo (ouro/aço/ferrugem/osso/azul),
 * sombreamento em camadas e expressões por humor.
 */
export function LeifMascot({
  variant = "avatar",
  style = "crafted",
  mood = "normal",
  pose = "idle",
  item = "axe",
  animated = false,
  className,
  title = "Leif",
}: {
  variant?: LeifMascotVariant;
  style?: LeifMascotStyle;
  mood?: LeifMood;
  pose?: LeifPose;
  item?: LeifItem;
  animated?: boolean;
  className?: string;
  title?: string;
}) {
  if (style === "blocky") {
    return <LeifMascotBlocky variant={variant} className={className} title={title} />;
  }
  return <LeifMascotCrafted variant={variant} mood={mood} pose={pose} item={item} animated={animated} className={className} title={title} />;
}

/* ─────────────────────────── Paleta-material (identidade fixa) ───────────── */
const C = {
  ink: "#3a2a1e", // contorno quente
  inkSoft: "#5a4632",

  steelL: "#dde1e7",
  steel: "#aab2bd",
  steelD: "#7a828f",

  goldL: "#f6dc8e",
  gold: "#e0b84e",
  goldD: "#b07f24",

  skinL: "#f0c6a2",
  skin: "#e3ad84",
  skinD: "#c98f64",

  hornL: "#efe7d2",
  hornD: "#b3a079",

  beardL: "#e0894a",
  beard: "#c9682f",
  beardD: "#9c4a1a",

  furL: "#9a9486",
  fur: "#746f62",
  furD: "#544f44",

  cloak: "#3f6f8f",
  cloakD: "#2b4d65",

  tunic: "#3c6e47",
  tunicD: "#2a4f33",

  gem: "#4a7eb5",
  gemL: "#9fc6e6",
  white: "#fff7ea",
};

function LeifMascotCrafted({
  variant,
  mood,
  pose = "idle",
  item = "axe",
  animated,
  className,
  title,
}: {
  variant: LeifMascotVariant;
  mood: LeifMood;
  pose?: LeifPose;
  item?: LeifItem;
  animated?: boolean;
  className?: string;
  title: string;
}) {
  const uid = React.useId().replace(/[:]/g, "");
  const id = (s: string) => `leif_${uid}_${s}`;
  const isFull = variant === "full";
  const viewBox = isFull ? "0 0 240 372" : "0 0 240 244";
  const animClass = animated ? (mood === "celebrate" ? "leif-bob" : "leif-breathe") : null;

  return (
    <svg
      viewBox={viewBox}
      className={cn("block", animClass, className)}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>

      <defs>
        <linearGradient id={id("helm")} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={C.steelL} />
          <stop offset="55%" stopColor={C.steel} />
          <stop offset="100%" stopColor={C.steelD} />
        </linearGradient>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.goldL} />
          <stop offset="55%" stopColor={C.gold} />
          <stop offset="100%" stopColor={C.goldD} />
        </linearGradient>
        <radialGradient id={id("skin")} cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor={C.skinL} />
          <stop offset="68%" stopColor={C.skin} />
          <stop offset="100%" stopColor={C.skinD} />
        </radialGradient>
        <linearGradient id={id("beard")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.beardL} />
          <stop offset="55%" stopColor={C.beard} />
          <stop offset="100%" stopColor={C.beardD} />
        </linearGradient>
        <linearGradient id={id("fur")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.furL} />
          <stop offset="100%" stopColor={C.furD} />
        </linearGradient>
        <linearGradient id={id("cloak")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.cloak} />
          <stop offset="100%" stopColor={C.cloakD} />
        </linearGradient>
        <linearGradient id={id("tunic")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.tunic} />
          <stop offset="100%" stopColor={C.tunicD} />
        </linearGradient>
        <radialGradient id={id("gem")} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={C.gemL} />
          <stop offset="100%" stopColor={C.gem} />
        </radialGradient>
        <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={C.ink} floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter={`url(#${id("soft")})`}>
        {isFull ? <CraftedBody id={id} pose={pose} item={item} /> : null}
        <CraftedBust id={id} mood={mood} animated={animated} />
      </g>
    </svg>
  );
}

/* ─────────────────────────── Busto: capacete, rosto, barba ───────────────── */
function CraftedBust({ id, mood, animated }: { id: (s: string) => string; mood: LeifMood; animated?: boolean }) {
  return (
    <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      {/* Colar de pele / ombros */}
      <path
        d="M 36 226 C 58 198, 92 210, 120 210 C 148 210, 182 198, 204 226 C 196 236, 184 240, 170 240 L 70 240 C 56 240, 44 236, 36 226 Z"
        fill={`url(#${id("fur")})`}
      />
      <path d="M 60 220 q 8 -10 18 -6 M 96 214 q 10 -8 20 -2 M 128 213 q 12 -7 22 1 M 164 219 q 9 -9 18 -4" fill="none" stroke={C.furD} strokeWidth={2} />

      {/* Pauldrons (ombreiras) */}
      <ellipse cx={52} cy={214} rx={20} ry={15} fill={`url(#${id("helm")})`} />
      <ellipse cx={188} cy={214} rx={20} ry={15} fill={`url(#${id("helm")})`} />
      <ellipse cx={52} cy={214} rx={20} ry={15} fill="none" stroke={C.goldD} strokeWidth={2} />
      <ellipse cx={188} cy={214} rx={20} ry={15} fill="none" stroke={C.goldD} strokeWidth={2} />
      <circle cx={52} cy={214} r={4} fill={`url(#${id("gold")})`} />
      <circle cx={188} cy={214} r={4} fill={`url(#${id("gold")})`} />

      {/* Chifres de marfim */}
      <path d="M 64 116 C 44 112, 26 98, 20 72 C 19 65, 27 63, 32 72 C 41 92, 54 104, 72 108 Z" fill={C.hornL} />
      <path d="M 176 116 C 196 112, 214 98, 220 72 C 221 65, 213 63, 208 72 C 199 92, 186 104, 168 108 Z" fill={C.hornL} />
      <path d="M 64 116 C 50 112, 38 102, 30 84 C 40 98, 54 106, 70 110 Z" fill={C.hornD} opacity={0.5} stroke="none" />
      <path d="M 176 116 C 190 112, 202 102, 210 84 C 200 98, 186 106, 170 110 Z" fill={C.hornD} opacity={0.5} stroke="none" />
      <path d="M 38 74 q 8 6 15 9 M 30 82 q 9 7 17 11 M 24 92 q 10 6 18 10" fill="none" stroke={C.hornD} strokeWidth={1.6} />
      <path d="M 202 74 q -8 6 -15 9 M 210 82 q -9 7 -17 11 M 216 92 q -10 6 -18 10" fill="none" stroke={C.hornD} strokeWidth={1.6} />

      {/* Rosto (pele) */}
      <path
        d="M 72 120 C 70 156, 86 182, 120 184 C 154 182, 170 156, 168 120 C 150 134, 90 134, 72 120 Z"
        fill={`url(#${id("skin")})`}
      />

      {/* Capacete (domo) */}
      <path d="M 56 122 C 48 58, 90 32, 120 32 C 150 32, 192 58, 184 122 C 150 104, 90 104, 56 122 Z" fill={`url(#${id("helm")})`} />
      {/* Reflexo do domo */}
      <path d="M 88 44 C 78 64, 74 86, 78 108" fill="none" stroke={C.steelL} strokeWidth={4} strokeOpacity={0.8} />
      <path d="M 120 36 C 116 60, 116 86, 118 106" fill="none" stroke={C.steelL} strokeWidth={2} strokeOpacity={0.5} />

      {/* Banda da testa (ouro) com rebites */}
      <path d="M 54 110 C 90 128, 150 128, 186 110 L 184 128 C 150 146, 90 146, 56 128 Z" fill={`url(#${id("gold")})`} />
      {[70, 92, 120, 148, 170].map((x) => (
        <circle key={x} cx={x} cy={123} r={2.6} fill={C.goldD} stroke="none" />
      ))}

      {/* Gema central */}
      <path d="M 120 110 l 8 9 l -8 9 l -8 -9 Z" fill={`url(#${id("gem")})`} />
      <path d="M 120 110 l 8 9 l -8 9 l -8 -9 Z" fill="none" stroke={C.goldD} strokeWidth={2} />

      {/* Protetor nasal */}
      <path d="M 112 128 L 128 128 L 126 166 C 126 172, 114 172, 114 166 Z" fill={`url(#${id("helm")})`} />
      <path d="M 120 132 L 120 162" fill="none" stroke={C.steelL} strokeWidth={2} strokeOpacity={0.7} />

      {/* Olhos + sobrancelhas por humor */}
      <Eyes mood={mood} animated={animated} />

      {/* Barba ruiva */}
      <path
        d="M 74 150 C 68 196, 96 232, 120 236 C 144 232, 172 196, 166 150 C 158 176, 140 188, 120 188 C 100 188, 82 176, 74 150 Z"
        fill={`url(#${id("beard")})`}
      />
      {/* Fios da barba */}
      <path
        d="M 88 168 C 90 192, 100 210, 108 222 M 120 176 L 120 226 M 152 168 C 150 192, 140 210, 132 222 M 102 172 C 104 196, 110 212, 116 224 M 138 172 C 136 196, 130 212, 124 224"
        fill="none"
        stroke={C.beardD}
        strokeWidth={2}
        strokeOpacity={0.7}
      />
      {/* Bigode */}
      <path d="M 98 150 C 108 160, 132 160, 142 150 C 138 158, 130 164, 120 164 C 110 164, 102 158, 98 150 Z" fill={C.beardD} />

      {/* Tranças com presilhas de ouro */}
      <path d="M 100 224 C 96 236, 98 248, 104 256 C 110 248, 110 236, 108 224 Z" fill={`url(#${id("beard")})`} />
      <path d="M 132 224 C 130 236, 130 248, 136 256 C 142 248, 144 236, 140 224 Z" fill={`url(#${id("beard")})`} />
      <rect x={97} y={232} width={14} height={6} rx={3} fill={`url(#${id("gold")})`} />
      <rect x={129} y={232} width={14} height={6} rx={3} fill={`url(#${id("gold")})`} />

      {/* Decoração por humor */}
      <MoodFx id={id} mood={mood} />
    </g>
  );
}

/* ─────────────────────────── Olhos + sobrancelhas ────────────────────────── */
function Eyes({ mood, animated }: { mood: LeifMood; animated?: boolean }) {
  const lx = 104;
  const rx = 136;
  const ey = 142;
  const blinkClass = animated ? "leif-eyes" : undefined;

  if (mood === "celebrate") {
    return (
      <g>
        <path d={`M ${lx - 7} ${ey + 1} C ${lx - 3} ${ey - 6}, ${lx + 3} ${ey - 6}, ${lx + 7} ${ey + 1}`} fill="none" stroke={C.ink} strokeWidth={3.5} />
        <path d={`M ${rx - 7} ${ey + 1} C ${rx - 3} ${ey - 6}, ${rx + 3} ${ey - 6}, ${rx + 7} ${ey + 1}`} fill="none" stroke={C.ink} strokeWidth={3.5} />
        {/* bochechas rosadas */}
        <ellipse cx={lx - 6} cy={ey + 12} rx={6} ry={3.5} fill="#e8967a" opacity={0.55} stroke="none" />
        <ellipse cx={rx + 6} cy={ey + 12} rx={6} ry={3.5} fill="#e8967a" opacity={0.55} stroke="none" />
        {/* sobrancelhas erguidas */}
        <path d={`M ${lx - 9} ${ey - 12} C ${lx - 3} ${ey - 16}, ${lx + 4} ${ey - 15}, ${lx + 9} ${ey - 11}`} fill="none" stroke={C.inkSoft} strokeWidth={3} />
        <path d={`M ${rx - 9} ${ey - 11} C ${rx - 4} ${ey - 15}, ${rx + 3} ${ey - 16}, ${rx + 9} ${ey - 12}`} fill="none" stroke={C.inkSoft} strokeWidth={3} />
      </g>
    );
  }

  if (mood === "sleep") {
    return (
      <g>
        {/* olhos fechados (curvas suaves para baixo) */}
        <path d={`M ${lx - 6} ${ey} q 6 5 12 0`} fill="none" stroke={C.ink} strokeWidth={3.5} />
        <path d={`M ${rx - 6} ${ey} q 6 5 12 0`} fill="none" stroke={C.ink} strokeWidth={3.5} />
        {/* sobrancelhas relaxadas */}
        <path d={`M ${lx - 9} ${ey - 11} C ${lx - 3} ${ey - 12}, ${lx + 4} ${ey - 12}, ${lx + 9} ${ey - 11}`} fill="none" stroke={C.inkSoft} strokeWidth={3} />
        <path d={`M ${rx - 9} ${ey - 11} C ${rx - 4} ${ey - 12}, ${rx + 3} ${ey - 12}, ${rx + 9} ${ey - 11}`} fill="none" stroke={C.inkSoft} strokeWidth={3} />
      </g>
    );
  }

  if (mood === "sad") {
    return (
      <g>
        {/* olhos menores olhando para baixo */}
        <ellipse cx={lx} cy={ey + 1} rx={3.2} ry={3.6} fill={C.ink} stroke="none" />
        <ellipse cx={rx} cy={ey + 1} rx={3.2} ry={3.6} fill={C.ink} stroke="none" />
        <circle cx={lx - 0.8} cy={ey + 2} r={1} fill={C.white} stroke="none" />
        <circle cx={rx - 0.8} cy={ey + 2} r={1} fill={C.white} stroke="none" />
        {/* sobrancelhas tristes (interno erguido) */}
        <path d={`M ${lx - 9} ${ey - 9} L ${lx + 8} ${ey - 14}`} fill="none" stroke={C.inkSoft} strokeWidth={3} />
        <path d={`M ${rx + 9} ${ey - 9} L ${rx - 8} ${ey - 14}`} fill="none" stroke={C.inkSoft} strokeWidth={3} />
      </g>
    );
  }

  // Geometria de olhos abertos por humor
  const eye = { rx: 3.6, ry: 4.4 };
  if (mood === "motivate") {
    eye.ry = 3.0;
  } else if (mood === "warn") {
    eye.rx = 4.2;
    eye.ry = 4.8;
  }

  const brow =
    mood === "motivate"
      ? // franzido / determinado (interno mais baixo)
        `M ${lx - 9} ${ey - 13} L ${lx + 8} ${ey - 8}  M ${rx + 9} ${ey - 13} L ${rx - 8} ${ey - 8}`
      : mood === "warn"
        ? // preocupado (interno mais alto, arqueado)
          `M ${lx - 9} ${ey - 9} C ${lx - 2} ${ey - 14}, ${lx + 5} ${ey - 14}, ${lx + 9} ${ey - 12}  M ${rx - 9} ${ey - 12} C ${rx - 5} ${ey - 14}, ${rx + 2} ${ey - 14}, ${rx + 9} ${ey - 9}`
        : // normal / relaxado
          `M ${lx - 9} ${ey - 11} C ${lx - 3} ${ey - 13}, ${lx + 4} ${ey - 13}, ${lx + 9} ${ey - 11}  M ${rx - 9} ${ey - 11} C ${rx - 4} ${ey - 13}, ${rx + 3} ${ey - 13}, ${rx + 9} ${ey - 11}`;

  return (
    <g>
      <g className={blinkClass}>
        <ellipse cx={lx} cy={ey} rx={eye.rx} ry={eye.ry} fill={C.ink} stroke="none" />
        <ellipse cx={rx} cy={ey} rx={eye.rx} ry={eye.ry} fill={C.ink} stroke="none" />
        <circle cx={lx - 1.2} cy={ey - 1.4} r={1.1} fill={C.white} stroke="none" />
        <circle cx={rx - 1.2} cy={ey - 1.4} r={1.1} fill={C.white} stroke="none" />
      </g>
      <path d={brow} fill="none" stroke={C.inkSoft} strokeWidth={3} />
    </g>
  );
}

/* ─────────────────────────── Efeitos por humor ───────────────────────────── */
function MoodFx({ id, mood }: { id: (s: string) => string; mood: LeifMood }) {
  if (mood === "celebrate") {
    const star = (cx: number, cy: number, r: number) => (
      <path
        d={`M ${cx} ${cy - r} L ${cx + r * 0.32} ${cy - r * 0.32} L ${cx + r} ${cy} L ${cx + r * 0.32} ${cy + r * 0.32} L ${cx} ${cy + r} L ${cx - r * 0.32} ${cy + r * 0.32} L ${cx - r} ${cy} L ${cx - r * 0.32} ${cy - r * 0.32} Z`}
        fill={`url(#${id("gold")})`}
        stroke={C.goldD}
        strokeWidth={1.5}
      />
    );
    return (
      <g>
        {star(40, 60, 9)}
        {star(200, 52, 11)}
        {star(120, 22, 8)}
      </g>
    );
  }
  if (mood === "warn") {
    // gota de suor
    return (
      <path
        d="M 158 116 C 152 124, 150 130, 155 134 C 161 134, 163 127, 158 116 Z"
        fill={`url(#${id("gem")})`}
        stroke={C.cloakD}
        strokeWidth={1.5}
      />
    );
  }
  if (mood === "motivate") {
    // faísca de energia
    return (
      <g stroke={C.gold} strokeWidth={3} strokeLinecap="round">
        <path d="M 198 78 l 10 -8 M 202 92 l 12 -2 M 196 64 l 8 -10" fill="none" />
      </g>
    );
  }
  if (mood === "sleep") {
    // zZz
    return (
      <g fill={C.inkSoft} stroke="none" fontFamily="serif" fontWeight={700}>
        <text x={168} y={96} fontSize={14}>z</text>
        <text x={180} y={80} fontSize={18}>Z</text>
        <text x={196} y={62} fontSize={24}>Z</text>
      </g>
    );
  }
  return null;
}

/* ─────────────────────────── Corpo (variante full) ───────────────────────── */
function CraftedBody({ id, pose = "idle", item = "axe" }: { id: (s: string) => string; pose?: LeifPose; item?: LeifItem }) {
  const isHero = pose === "hero";
  // na pose hero a arma é erguida (translada + rotaciona em torno da mão)
  const weaponTransform = isHero ? "translate(-4 -40) rotate(-22 206 300)" : undefined;
  return (
    <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      {/* Sombra no chão (pose hero) */}
      {isHero && <ellipse cx={120} cy={368} rx={72} ry={7} fill={C.ink} opacity={0.16} stroke="none" />}

      {/* Capa atrás */}
      <path d="M 58 224 C 22 268, 30 336, 56 366 L 86 366 C 70 322, 70 268, 86 230 Z" fill={`url(#${id("cloak")})`} />
      <path d="M 182 224 C 218 268, 210 336, 184 366 L 154 366 C 170 322, 170 268, 154 230 Z" fill={`url(#${id("cloak")})`} />

      {/* Braços */}
      <path d="M 50 232 C 32 252, 28 296, 40 330 C 52 334, 64 330, 70 320 C 60 290, 62 258, 74 240 Z" fill={`url(#${id("tunic")})`} />
      <path d="M 190 232 C 208 252, 212 296, 200 330 C 188 334, 176 330, 170 320 C 180 290, 178 258, 166 240 Z" fill={`url(#${id("tunic")})`} />
      {/* Punhos */}
      <path d="M 36 326 C 34 340, 42 348, 54 346 C 62 344, 64 334, 60 326 Z" fill={`url(#${id("skin")})`} />
      <path d="M 204 326 C 206 340, 198 348, 186 346 C 178 344, 176 334, 180 326 Z" fill={`url(#${id("skin")})`} />

      {/* Torso (túnica) */}
      <path d="M 66 230 C 90 218, 150 218, 174 230 L 184 312 C 152 326, 88 326, 56 312 Z" fill={`url(#${id("tunic")})`} />
      {/* Costura central + ilhoses */}
      <path d="M 120 234 L 120 300" fill="none" stroke={C.tunicD} strokeWidth={2} />
      {[244, 256, 268, 280].map((y) => (
        <g key={y}>
          <path d={`M 110 ${y} L 120 ${y + 5} L 130 ${y}`} fill="none" stroke={C.goldD} strokeWidth={2} />
        </g>
      ))}

      {/* Cinto */}
      <path d="M 58 300 C 90 314, 150 314, 182 300 L 182 316 C 150 330, 90 330, 58 316 Z" fill={C.beardD} />
      <rect x={110} y={300} width={20} height={18} rx={4} fill={`url(#${id("gold")})`} />
      <rect x={116} y={306} width={8} height={6} rx={1.5} fill={C.goldD} stroke="none" />

      {/* Pernas / botas */}
      <path d="M 84 322 L 84 352 C 84 360, 96 362, 104 358 L 106 322 Z" fill={`url(#${id("tunic")})`} />
      <path d="M 156 322 L 156 352 C 156 360, 144 362, 136 358 L 134 322 Z" fill={`url(#${id("tunic")})`} />
      <path d="M 78 350 C 78 364, 88 368, 102 366 C 110 364, 110 354, 106 350 Z" fill={C.furD} />
      <path d="M 162 350 C 162 364, 152 368, 138 366 C 130 364, 130 354, 134 350 Z" fill={C.furD} />

      {/* Arma (lateral direita): machado ou escudo */}
      <g transform={weaponTransform}>
        {item === "shield" ? (
          <>
            {/* Escudo redondo viking */}
            <circle cx={206} cy={300} r={31} fill={C.beardD} />
            <circle cx={206} cy={300} r={31} fill="none" stroke={`url(#${id("gold")})`} strokeWidth={5} />
            {/* tábuas */}
            <path d="M 206 270 L 206 330 M 184 284 L 228 316 M 184 316 L 228 284" stroke={C.ink} strokeWidth={1.5} strokeOpacity={0.45} fill="none" />
            {/* umbo central (aço) */}
            <circle cx={206} cy={300} r={8} fill={`url(#${id("helm")})`} />
            <circle cx={206} cy={300} r={8} fill="none" stroke={C.ink} strokeWidth={2} />
            {/* rebites */}
            {[270, 300, 330].map((y) => (
              <circle key={`v${y}`} cx={206} cy={y === 300 ? 271 : y} r={2} fill={C.goldD} stroke="none" />
            ))}
          </>
        ) : (
          <>
            {/* Machado */}
            <path d="M 196 250 L 214 360" fill="none" stroke={C.beardD} strokeWidth={6} />
            <path
              d="M 196 250 C 214 244, 232 252, 234 270 C 224 270, 214 266, 206 262 C 214 274, 216 286, 212 296 C 202 286, 196 268, 196 250 Z"
              fill={`url(#${id("helm")})`}
            />
            <path d="M 200 256 C 212 254, 222 260, 226 268" fill="none" stroke={C.steelL} strokeWidth={2} strokeOpacity={0.7} />
          </>
        )}
      </g>
    </g>
  );
}

/* ─────────────────────────── Variante blocky (legado) ────────────────────── */
function LeifMascotBlocky({
  variant,
  className,
  title,
}: {
  variant: LeifMascotVariant;
  className?: string;
  title: string;
}) {
  const isFull = variant === "full";
  const viewBox = isFull ? "0 0 96 144" : "0 0 96 96";
  const px = 4;

  const border = "hsl(var(--border))";
  const fg = "hsl(var(--fg))";
  const muted = "hsl(var(--muted))";
  const card = "hsl(var(--card))";
  const card2 = "hsl(var(--card-2))";
  const bone = "hsl(var(--bone))";
  const rust = "hsl(var(--rust))";
  const gold = "hsl(var(--gold))";
  const accent = "hsl(var(--accent))";
  const accentSoft = "hsl(var(--accent) / 0.28)";
  const blueSoft = "hsl(var(--viking-blue) / 0.22)";
  const steel = "hsl(var(--steel))";
  const forest = "hsl(var(--forest-dark))";

  const P = ({
    x,
    y,
    w = 1,
    h = 1,
    fill,
  }: {
    x: number;
    y: number;
    w?: number;
    h?: number;
    fill: string;
  }) => <rect x={x * px} y={y * px} width={w * px} height={h * px} fill={fill} />;

  const Head = ({ oy }: { oy: number }) => (
    <>
      <P x={5} y={oy + 2} w={14} h={8} fill={border} />
      <P x={6} y={oy + 3} w={12} h={6} fill={steel} />
      <P x={6} y={oy + 3} w={12} h={1} fill={card2} />
      <P x={6} y={oy + 8} w={12} h={1} fill={card} />
      <P x={3} y={oy + 4} w={2} h={3} fill={border} />
      <P x={19} y={oy + 4} w={2} h={3} fill={border} />
      <P x={9} y={oy + 4} w={6} h={2} fill={gold} />
      <P x={11} y={oy + 3} w={2} h={3} fill={gold} />
      <P x={10} y={oy + 6} w={4} h={1} fill={forest} />
      <P x={6} y={oy + 9} w={12} h={7} fill={border} />
      <P x={7} y={oy + 10} w={10} h={5} fill={bone} />
      <P x={9} y={oy + 12} w={2} h={2} fill={fg} />
      <P x={13} y={oy + 12} w={2} h={2} fill={fg} />
      <P x={11} y={oy + 14} w={2} h={1} fill={muted} />
      <P x={5} y={oy + 16} w={14} h={6} fill={border} />
      <P x={6} y={oy + 17} w={12} h={5} fill={rust} />
      <P x={11} y={oy + 18} w={2} h={2} fill={gold} />
    </>
  );

  const Body = ({ oy }: { oy: number }) => (
    <>
      <P x={4} y={oy + 0} w={16} h={5} fill={blueSoft} />
      <P x={6} y={oy + 1} w={12} h={3} fill={accentSoft} />
      <P x={6} y={oy + 2} w={12} h={12} fill={border} />
      <P x={7} y={oy + 3} w={10} h={10} fill={card2} />
      <P x={10} y={oy + 11} w={4} h={2} fill={gold} />
      <P x={5} y={oy + 14} w={14} h={4} fill={border} />
      <P x={6} y={oy + 15} w={12} h={3} fill={rust} />
      <P x={10} y={oy + 15} w={4} h={2} fill={gold} />
      <P x={5} y={oy + 25} w={5} h={7} fill={border} />
      <P x={14} y={oy + 25} w={5} h={7} fill={border} />
      <P x={6} y={oy + 26} w={3} h={5} fill={steel} />
      <P x={15} y={oy + 26} w={3} h={5} fill={steel} />
    </>
  );

  return (
    <svg viewBox={viewBox} className={cn("block", className)} role="img" aria-label={title} shapeRendering="crispEdges">
      <title>{title}</title>
      <g stroke="none">
        {!isFull ? (
          <Head oy={0} />
        ) : (
          <>
            <Head oy={0} />
            <Body oy={22} />
            <P x={6} y={25} w={2} h={2} fill={accent} />
            <P x={15} y={25} w={2} h={2} fill={accent} />
          </>
        )}
      </g>
    </svg>
  );
}
