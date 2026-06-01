export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export function isValidIsoDateString(
  value: string | undefined,
): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime());
}

export function formatIsoDate(isoDate: string, locale = "en-GB"): string {
  if (!isValidIsoDateString(isoDate)) return isoDate;
  const d = new Date(`${isoDate}T12:00:00`);
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
