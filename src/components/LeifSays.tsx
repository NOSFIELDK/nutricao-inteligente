import { cn } from "@/lib/utils";

type LeifMood = "normal" | "motivate" | "warn" | "celebrate";

const MOOD_STYLES: Record<LeifMood, string> = {
  normal:    "ring-gold/30 bg-bone/40",
  motivate:  "ring-accent/40 bg-accent/8",
  warn:      "ring-rust/40 bg-rust/8",
  celebrate: "ring-gold/50 bg-gold/10",
};

const MOOD_TAIL: Record<LeifMood, string> = {
  normal:    "bg-bone/60 ring-gold/30",
  motivate:  "bg-accent/20 ring-accent/30",
  warn:      "bg-rust/20 ring-rust/30",
  celebrate: "bg-gold/20 ring-gold/40",
};

type LeifSaysProps = {
  message: string;
  mood?: LeifMood;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function LeifSays({ message, mood = "normal", size = "md", className }: LeifSaysProps) {
  const imgSize = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {/* Leif */}
      <div className="flex-shrink-0">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Leif"
          className={cn(imgSize, "rounded-full object-cover ring-2 ring-gold/50 shadow-crisp")}
        />
      </div>

      {/* Balão de fala */}
      <div className="relative min-w-0 flex-1">
        {/* Tail do balão */}
        <div
          className={cn(
            "absolute -left-1.5 top-4 h-3 w-3 rotate-45 ring-1",
            MOOD_TAIL[mood],
          )}
        />
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm p-4 ring-1 shadow-crisp",
            MOOD_STYLES[mood],
          )}
        >
          <p className={cn("leading-relaxed text-fg/90", textSize)}>
            <span className="font-display text-xs font-bold text-gold">Leif diz: </span>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Variante compacta para empty states */
export function LeifEmptyState({
  title,
  message,
  mood = "normal",
}: {
  title: string;
  message: string;
  mood?: LeifMood;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl bg-card/80 p-8 ring-1 ring-border shadow-crisp animate-fade-up">
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="Leif"
        className="h-20 w-20 rounded-full object-cover ring-2 ring-gold/50 shadow-soft"
      />
      <div className="text-center">
        <div className="font-display text-lg font-bold text-fg">{title}</div>
        <p className="mt-1 text-sm text-muted leading-relaxed max-w-xs">{message}</p>
      </div>
    </div>
  );
}
