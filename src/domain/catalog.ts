import type { CatalogItem } from "@/domain/models";

export function getItem(catalog: CatalogItem[], params: { type: CatalogItem["type"]; id: string }) {
  return catalog.find((i) => i.type === params.type && i.id === params.id) ?? null;
}

export function itemTitle(item: CatalogItem) {
  if (item.type === "recipe") return item.title;
  if (item.type === "food") return item.title;
  return item.name;
}

