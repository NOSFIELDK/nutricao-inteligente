import type { MealSlot } from "@/domain/models";

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addDaysISO(dateISO: string, days: number) {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function mealSlotLabel(slot: MealSlot) {
  if (slot === "cafe") return "Café";
  if (slot === "almoco") return "Almoço";
  if (slot === "lanche") return "Lanche";
  return "Jantar";
}

