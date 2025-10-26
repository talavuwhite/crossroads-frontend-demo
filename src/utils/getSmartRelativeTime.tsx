import {
  differenceInYears,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  sub,
  format,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Returns a human-friendly relative time:
 * "just now", "5 minutes ago", "3 hours ago", "2 days ago", "1 week, 2 days ago", "1 year, 3 months ago"
 */
export function getSmartRelativeTime(dateStr: string): string {
  if (!dateStr) return "";

  const now = new Date();
  const date = toZonedTime(dateStr, userTimeZone);
  const diffMs = now.getTime() - date.getTime();

  if (isNaN(diffMs)) return "";

  // Handle less than 1 day via hours/minutes/just now
  const minutes = differenceInMinutes(now, date);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

  // More than a day: use "years, months, weeks, days" (like your old function)
  const years = differenceInYears(now, date);
  const afterYears = sub(now, { years });

  const months = differenceInMonths(afterYears, date);
  const afterMonths = sub(afterYears, { months });

  const weeks = differenceInWeeks(afterMonths, date);
  const afterWeeks = sub(afterMonths, { weeks });

  const days = differenceInDays(afterWeeks, date);

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
  } else if (months > 0) {
    parts.push(`${months} month${months > 1 ? "s" : ""}`);
    if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? "s" : ""}`);
  } else if (weeks > 0) {
    parts.push(`${weeks} week${weeks > 1 ? "s" : ""}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  } else {
    parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  }

  return parts.length ? `${parts.join(", ")} ago` : "Today";
}

// Format: "Jul 25, 2025"
export function formatArrivalDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = toZonedTime(new Date(dateStr), userTimeZone);
    return format(date, "MMM dd, yyyy");
  } catch {
    return "—";
  }
}

// Format: "Thu, Jul 24, 2025 at 11:19 AM"
export function formatCreatedAt(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = toZonedTime(new Date(dateStr), userTimeZone);
    return format(date, "EEE, MMM dd, yyyy 'at' h:mm a");
  } catch {
    return "—";
  }
}
