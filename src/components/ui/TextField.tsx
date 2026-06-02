import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function TextField({ className, label, hint, id, ...props }: InputProps) {
  const inputId = id ?? React.useId();

  return (
    <label className="grid gap-1.5">
      {label ? <span className="text-xs font-medium text-fg/90">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-lg bg-card/70 px-3 text-sm text-fg ring-1 ring-border placeholder:text-muted/70 shadow-crisp outline-none transition focus:ring-2 focus:ring-accent/35",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
};

export function SelectField({ className, label, hint, ...props }: SelectProps) {
  return (
    <label className="grid gap-1.5">
      {label ? <span className="text-xs font-medium text-fg/90">{label}</span> : null}
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-lg bg-card/70 px-3 text-sm text-fg ring-1 ring-border shadow-crisp outline-none transition focus:ring-2 focus:ring-accent/35",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}
