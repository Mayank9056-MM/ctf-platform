/**
 * Format a given number of bytes into a human-readable string.
 * @param bytes - The number of bytes to format.
 * @returns A string representing the number of bytes, with units of B, KB, or MB as appropriate.
 * @example formatBytes(1024) => "1.0KB"
 * @example formatBytes(1024 * 1024) => "1.0MB"
 */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
