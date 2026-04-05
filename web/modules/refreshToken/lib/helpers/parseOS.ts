/**
 * Parse a User-Agent string and return the OS name.
 * @param {string} [ua] User-Agent string
 * @returns {string} OS name
 */
export function parseOS(ua?: string): string {
  if (!ua) return "Unknown OS";
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown OS";
}
