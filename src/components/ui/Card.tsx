import type * as React from "react";

import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card/90 ring-1 ring-border shadow-soft backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("px-5 pt-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: DivProps) {
  return <div className={cn("font-display text-lg tracking-tight text-fg", className)} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
