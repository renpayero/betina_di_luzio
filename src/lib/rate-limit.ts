/**
 * Rate limit en memoria. Para escalar horizontal usar Redis (Phase 4).
 * Cada caller crea su propio bucket (login, contact, admin).
 */

const WINDOW_MS = 60_000;
const MAX_BUCKETS = 256;

export interface Bucket {
  hits: number[];
}

const stores = new Map<string, Map<string, number[]>>();

export const createRateLimit = (name: string, max = 5) => {
  if (!stores.has(name)) stores.set(name, new Map());
  const buckets = stores.get(name)!;
  return {
    allow(ip: string): boolean {
      const now = Date.now();
      const cutoff = now - WINDOW_MS;
      const recent = (buckets.get(ip) ?? []).filter((t) => t > cutoff);
      if (recent.length >= max) {
        buckets.set(ip, recent);
        return false;
      }
      recent.push(now);
      buckets.set(ip, recent);
      if (buckets.size > MAX_BUCKETS) {
        for (const [k, v] of buckets) {
          const fresh = v.filter((t) => t > cutoff);
          if (fresh.length === 0) buckets.delete(k);
          else buckets.set(k, fresh);
        }
      }
      return true;
    },
    reset(ip: string): void {
      buckets.delete(ip);
    },
  };
};
