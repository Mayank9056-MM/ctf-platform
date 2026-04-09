// Dashboard helpers

/**
 * Format a number into a string with a unit suffix (K, M) when appropriate.
 * @param n - The number to format.
 * @returns A string representation of the number, with a unit suffix (K, M) when the number is >= 1000.
 * @example fmt(1000) => "1.0K"
 * @example fmt(1000000) => "1.0M"
 */
export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Returns a string representing the percentage of a compared to b.
 * If b is zero or falsy, returns "0%".
 * @example pct(10, 20) => "50%"
 */
export function pct(a: number, b: number): string {
  if (!b) return "0%";
  return `${Math.round((a / b) * 100)}%`;
}

/**
 * Returns a human-readable string representing the time elapsed since the given date.
 * If the given date is within the last minute, returns "just now".
 * If the given date is within the last hour, returns "[X]m ago".
 * If the given date is within the last day, returns "[X]h ago".
 * Otherwise, returns "[X]d ago".
 * @param date - A Date object or a string representing a date in the format "YYYY-MM-DDTHH:mm:ssZ".
 * @returns A string representation of the time elapsed since the given date.
 * @example timeAgo(new Date("2022-01-01T00:00:00Z")) => "14d ago"
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
