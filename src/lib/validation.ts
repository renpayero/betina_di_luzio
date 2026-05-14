/**
 * Validation helpers — sin dependencias externas, sin Zod por ahora.
 * Devuelve { ok: true, value } o { ok: false, error }.
 * El caller decide qué hacer (response 400, mensajes UI, etc.).
 */

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: string };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = (error: string): Err => ({ ok: false, error });

export const trim = (raw: FormDataEntryValue | null | undefined): string =>
  typeof raw === 'string' ? raw.trim() : '';

export const optTrim = (raw: FormDataEntryValue | null | undefined): string | null => {
  const s = trim(raw);
  return s.length ? s : null;
};

export const parseInt10 = (raw: FormDataEntryValue | null | undefined): number | null => {
  const s = trim(raw);
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
};

export const requireText = (
  value: string,
  field: string,
  min = 1,
  max = 500
): Result<string> => {
  if (value.length < min) return err(`${field}: mínimo ${min} caracteres.`);
  if (value.length > max) return err(`${field}: máximo ${max} caracteres.`);
  return ok(value);
};

export const requireSlug = (raw: string, field = 'slug'): Result<string> => {
  const cleaned = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (cleaned.length < 2) return err(`${field}: inválido.`);
  if (cleaned.length > 64) return err(`${field}: máximo 64 caracteres.`);
  return ok(cleaned);
};

export const requireInt = (
  raw: number | null,
  field: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): Result<number> => {
  if (raw === null || !Number.isInteger(raw))
    return err(`${field}: número entero requerido.`);
  if (raw < min) return err(`${field}: mínimo ${min}.`);
  if (raw > max) return err(`${field}: máximo ${max}.`);
  return ok(raw);
};

export const requireOneOf = <T extends string>(
  raw: string,
  field: string,
  allowed: readonly T[]
): Result<T> => {
  if (!(allowed as readonly string[]).includes(raw))
    return err(`${field}: valor no permitido.`);
  return ok(raw as T);
};

export const parseBool = (raw: FormDataEntryValue | null | undefined): boolean => {
  const s = trim(raw).toLowerCase();
  return s === 'true' || s === 'on' || s === '1' || s === 'yes';
};

/**
 * Lee un checkbox con el patrón hidden=false + checkbox=true:
 * si alguno de los valores enviados es truthy, retorna true.
 */
export const parseCheckbox = (form: FormData, name: string): boolean => {
  for (const v of form.getAll(name)) {
    if (typeof v !== 'string') continue;
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === 'on' || s === '1' || s === 'yes') return true;
  }
  return false;
};

export const parseList = (raw: FormDataEntryValue | null | undefined): string[] => {
  const s = trim(raw);
  if (!s) return [];
  return s
    .split(/[,\n]+/g)
    .map((p) => p.trim())
    .filter(Boolean);
};

export const parseHexColors = (raw: FormDataEntryValue | null | undefined): string[] => {
  return parseList(raw)
    .map((c) => (c.startsWith('#') ? c : `#${c}`).toUpperCase())
    .filter((c) => /^#[0-9A-F]{6}$/.test(c));
};

export const parseDate = (raw: FormDataEntryValue | null | undefined): Date | null => {
  const s = trim(raw);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};
