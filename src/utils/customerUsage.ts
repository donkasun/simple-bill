export type CustomerUsageMap = Record<string, number>; // customerId -> unix timestamp ms

function storageKey(userId: string) {
  return `simplebill:customerUsage:${userId}`;
}

export function loadCustomerUsage(userId: string): CustomerUsageMap {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: CustomerUsageMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function recordCustomerBilled(
  userId: string,
  customerId: string,
): CustomerUsageMap {
  const current = loadCustomerUsage(userId);
  const next: CustomerUsageMap = { ...current, [customerId]: Date.now() };
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
  return next;
}

export function recentCustomerIds(
  usage: CustomerUsageMap,
  max: number,
): string[] {
  return Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([id]) => id);
}

export function formatLastBilled(timestamp: number): string {
  const diffDays = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Last billed today";
  if (diffDays === 1) return "Last billed yesterday";
  return `Last billed ${diffDays} days ago`;
}
