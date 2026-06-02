import type * as React from "react";

import { cn } from "@/lib/utils";

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ className, active, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 transition",
        active
          ? "bg-accent/20 text-fg ring-accent/30"
          : "bg-card-2/80 text-muted ring-border hover:bg-card-2 hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "accent" | "accent2";
};

export function Badge({ className, tone = "muted", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
        tone === "muted" && "bg-card-2/70 text-muted ring-border",
        tone === "accent" && "bg-accent/18 text-fg ring-accent/30",
        tone === "accent2" && "bg-accent-2/18 text-fg ring-accent-2/30",
        className,
      )}
      {...props}
    />
  );
}
