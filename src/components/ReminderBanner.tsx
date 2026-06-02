import { Bell, X } from "lucide-react";

import { useReminders } from "@/hooks/useReminders";

export function ReminderBanner() {
  const { active, dismiss } = useReminders();

  if (!active) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 md:bottom-8 md:left-auto md:right-6 md:w-80 animate-fade-up">
      <div className="flex items-start gap-3 rounded-2xl bg-accent px-4 py-4 shadow-soft ring-1 ring-accent/60">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-black/10">
          <Bell className="h-4 w-4 text-fg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-semibold text-fg">{active.label}</div>
          <div className="mt-0.5 text-sm text-fg/80">{active.message}</div>
        </div>
        <button
          onClick={dismiss}
          className="mt-0.5 shrink-0 rounded-lg p-1.5 text-fg/70 transition hover:bg-black/10 hover:text-fg"
          aria-label="Dispensar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
