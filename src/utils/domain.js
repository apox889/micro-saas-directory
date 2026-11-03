/**
 * Extracts clean domain name from a URL or domain string
 * e.g. "https://linear.app/?ref=antibloat" -> "linear.app"
 */
export function extractDomain(urlOrDomain) {
  if (!urlOrDomain) return '';
  try {
    const raw = String(urlOrDomain).trim();
    const url = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return String(urlOrDomain)
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split('?')[0]
      .replace(/^www\./, '')
      .toLowerCase();
  }
}
