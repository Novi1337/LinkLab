// Einfaches In-Memory-Rate-Limit (Sliding Window) für API-Routen.
//
// Bewusste Einschränkung: Der Zähler lebt pro Server-Instanz (bei Serverless-
// Deployments also pro warmer Instanz) und ist damit "best effort" - für einen
// harten, verteilten Schutz bräuchte es einen externen Store (z. B. Redis).
// Für die hiesigen Zwecke (Bremsen von Scraping-/Spam-/Enumeration-Versuchen
// einzelner Clients) reicht das aus und kommt ohne zusätzliche Infrastruktur aus.

type WindowEntry = {
  timestamps: number[];
};

const buckets = new Map<string, WindowEntry>();

// Speicher sauber halten: alte Einträge regelmäßig entsorgen, damit die Map
// bei vielen unterschiedlichen Keys (z. B. IPs) nicht unbegrenzt wächst.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of buckets) {
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
    if (entry.timestamps.length === 0) buckets.delete(key);
  }
}

/**
 * Prüft und verbucht einen Request für den gegebenen Key.
 * @returns true, wenn der Request erlaubt ist; false, wenn das Limit erreicht wurde.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  cleanup(now, windowMs);

  const entry = buckets.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    buckets.set(key, entry);
    return false;
  }

  entry.timestamps.push(now);
  buckets.set(key, entry);
  return true;
}

/** Ermittelt die Client-IP aus den üblichen Proxy-Headern (Vercel: x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
