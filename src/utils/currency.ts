export function formatCurrency(
  value: number,
  currency: string,
  locale?: string,
): string {
  const safe = Number.isFinite(value) ? value : 0;
  const resolvedLocale =
    locale || (typeof navigator !== "undefined" ? navigator.language : "en-US");
  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    // Fallback for unsupported currencies
    return `${currency} ${safe.toFixed(2)}`;
  }
}
