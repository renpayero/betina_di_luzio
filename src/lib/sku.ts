/**
 * SKU generator: prefijo de categoría + secuencia.
 * Formato: <CAT2>-<NNN>  ej. SW-001, CA-002.
 */

const CAT_PREFIX: Record<string, string> = {
  sweaters: 'SW',
  cardigans: 'CA',
  mantas: 'MA',
  accesorios: 'AC',
  bebes: 'BE',
  home: 'HO',
};

export const prefixFromCategory = (categoryId: string): string => {
  if (CAT_PREFIX[categoryId]) return CAT_PREFIX[categoryId]!;
  return categoryId.slice(0, 2).toUpperCase();
};

export const nextSku = (categoryId: string, existingSkus: string[]): string => {
  const prefix = prefixFromCategory(categoryId);
  const taken = new Set(existingSkus);
  for (let i = 1; i < 10_000; i++) {
    const candidate = `${prefix}-${String(i).padStart(3, '0')}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error(`No quedan SKUs disponibles con prefijo ${prefix}`);
};

export const slugFromName = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

export const nextProductId = (existingIds: string[]): string => {
  const max = existingIds
    .map((id) => Number(id.replace(/^p/, '')))
    .filter((n) => Number.isInteger(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `p${String(max + 1).padStart(2, '0')}`;
};
