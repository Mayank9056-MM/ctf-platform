/**
 * Parse a User-Agent string and return the name of the browser.
 * If the User-Agent string is not provided or is not recognized, returns "Unknown browser".
 * @param {string} [ua] - The User-Agent string
 * @returns {string} - The name of the browser
 */
export function parseBrowser(ua?: string): string {
  if (!ua) return "Unknown browser";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/curl/.test(ua)) return "cURL";
  return "Unknown browser";
}
