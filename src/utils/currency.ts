export const SUPPORTED_CURRENCIES = [
  "USD",
  "LKR",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(
  currency: string,
): currency is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(currency);
}

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
