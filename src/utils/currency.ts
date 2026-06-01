export const SUPPORTED_CURRENCIES = [
  "USD",
  "LKR",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Default order for Settings and other pickers (LKR-first for primary audience). */
export const CURRENCY_PICKER_ORDER: SupportedCurrency[] = [
  "LKR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
];

export const CURRENCY_DISPLAY_NAMES: Record<SupportedCurrency, string> = {
  LKR: "Sri Lankan rupee",
  USD: "US dollar",
  EUR: "Euro",
  GBP: "British pound",
  AUD: "Australian dollar",
  CAD: "Canadian dollar",
};

/** Example amount shown on currency choice cards in Settings. */
export const CURRENCY_SAMPLE_AMOUNT = 12_500;

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
