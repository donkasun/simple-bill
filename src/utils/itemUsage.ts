import type { Item } from "../types/item";

export type ItemUsageMap = Record<string, number>;

function storageKey(userId: string) {
  return `simplebill:itemUsage:${userId}`;
}

export function loadItemUsage(userId: string): ItemUsageMap {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: ItemUsageMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function incrementItemUsage(
  userId: string,
  itemId: string,
): ItemUsageMap {
  const current = loadItemUsage(userId);
  const next: ItemUsageMap = {
    ...current,
    [itemId]: (current[itemId] ?? 0) + 1,
  };
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
  return next;
}

export function recentItemIds(usage: ItemUsageMap, max: number): string[] {
  return Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([id]) => id);
}

export function sortCatalogByUsage(
  catalog: Item[],
  usage: ItemUsageMap,
): Item[] {
  if (catalog.length <= 1) return catalog;
  const getScore = (id?: string) => (id ? (usage[id] ?? 0) : 0);
  return [...catalog].sort((a, b) => {
    const sa = getScore(a.id);
    const sb = getScore(b.id);
    if (sa !== sb) return sb - sa;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });
}
