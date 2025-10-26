import { toZonedTime } from "date-fns-tz";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Parses an ISO date string to { day, month, year } or returns null if invalid
export function parseDateStringToParts(
  dateString: string | null | undefined
): { day: string; month: string; year: string } | null {
  if (!dateString) return null;
  const dateObj = toZonedTime(dateString, userTimeZone);
  if (isNaN(dateObj.getTime())) return null;
  return {
    day: String(dateObj.getUTCDate()),
    month: String(dateObj.getUTCMonth() + 1),
    year: String(dateObj.getUTCFullYear()),
  };
}

export function datePartsToISOString(parts: {
  day: string;
  month: string;
  year: string;
}): string | null {
  if (!parts?.day || !parts?.month || !parts?.year) return null;
  const date = new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
  );
  return isNaN(date.getTime()) ? null : date.toISOString();
}
