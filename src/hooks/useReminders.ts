import * as React from "react";

import type { AppReminder } from "@/domain/models";
import { useAppStore } from "@/store/useAppStore";

export type ActiveReminder = AppReminder & { firedAt: number };

export function useReminders() {
  const reminders = useAppStore((s) => s.reminders);
  const [active, setActive] = React.useState<ActiveReminder | null>(null);

  React.useEffect(() => {
    const enabled = reminders.filter((r) => r.enabled);
    if (enabled.length === 0) return;

    const timers = enabled.map((r) =>
      window.setInterval(() => {
        setActive({ ...r, firedAt: Date.now() });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(r.label, { body: r.message });
        }
      }, r.intervalMinutes * 60 * 1000),
    );

    return () => timers.forEach(window.clearInterval);
  }, [reminders]);

  return { active, dismiss: () => setActive(null) };
}
