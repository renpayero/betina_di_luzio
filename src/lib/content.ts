import { getContentBlock } from './queries.ts';

const TTL_MS = 1_000;
const cache = new Map<string, { value: string; expires: number }>();

const fetchRaw = async (key: string): Promise<string | null> => {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value;
  const row = await getContentBlock(key);
  const v = row?.value ?? null;
  if (v !== null) cache.set(key, { value: v, expires: now + TTL_MS });
  return v;
};

export const getContent = async (key: string, fallback = ''): Promise<string> => {
  const v = await fetchRaw(key);
  return v ?? fallback;
};

export const getContentImage = async (
  key: string,
  fallback: string | null = null
): Promise<string | null> => {
  const v = await fetchRaw(key);
  if (!v) return fallback;
  return v.startsWith('/uploads/') ? v : fallback;
};

export const getContentBool = async (
  key: string,
  fallback = false
): Promise<boolean> => {
  const v = await fetchRaw(key);
  if (v === null) return fallback;
  return v === 'true' || v === '1' || v === 'on' || v === 'yes';
};

export const invalidateContentCache = (): void => {
  cache.clear();
};
