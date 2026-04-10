
/**
 * Returns a human-readable string representing the date in the format "MMM d, yyyy".
 * @param iso - A string representing a date in the format "YYYY-MM-DDTHH:mm:ssZ".
 * @returns A string representation of the date.
 * @example formatDate("2022-01-01T00:00:00Z")) => "Jan 1, 2022"
 */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}