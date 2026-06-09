import type * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition duration-150 will-change-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3",
        size === "md" && "h-10 px-4",
        size === "lg" && "h-11 px-5",
        variant === "primary" &&
          "bg-accent text-fg shadow-crisp hover:brightness-[1.02] active:translate-y-px active:shadow-none",
        variant === "secondary" &&
          "bg-card-2 text-fg ring-1 ring-border shadow-crisp hover:bg-card hover:ring-border/80 active:translate-y-px active:shadow-none",
        variant === "ghost" && "text-fg hover:bg-card-2 active:translate-y-px",
        variant === "danger" &&
          "bg-red-500/90 text-white shadow-crisp hover:bg-red-500 active:translate-y-px active:shadow-none",
        className,
      )}
      {...props}
    />
  );
}
