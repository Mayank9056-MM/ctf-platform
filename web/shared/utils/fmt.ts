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