/**
 * Returns a string representing the percentage of a compared to b.
 * If b is zero or falsy, returns "0%".
 * @example pct(10, 20) => "50%"
 */
export function pct(a: number, b: number): string {
  if (!b) return "0%";
  return `${Math.round((a / b) * 100)}%`;
}
