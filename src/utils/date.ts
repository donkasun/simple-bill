export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export function formatIsoDate(isoDate: string, locale = "en-GB"): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return isoDate;
  }
}
