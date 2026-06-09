import type { MealSlot } from "@/domain/models";

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addDaysISO(dateISO: string, days: number) {
  // Parse manual (ano, mês, dia) para construir meia-noite LOCAL e evitar o
  // shift de fuso de `new Date("yyyy-mm-dd")`, que é interpretado como UTC e
  // retornava o dia anterior em fusos negativos (ex.: UTC−3).
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function mealSlotLabel(slot: MealSlot) {
  if (slot === "cafe") return "Café";
  if (slot === "almoco") return "Almoço";
  if (slot === "lanche") return "Lanche";
  return "Jantar";
}

