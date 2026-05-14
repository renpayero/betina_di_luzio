import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from './validation.ts';

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const ALLOWED_SECTIONS = [
  'home',
  'about',
  'category',
  'product',
  'generic',
] as const;
export type UploadSection = (typeof ALLOWED_SECTIONS)[number];

export const MAX_BYTES = 4 * 1024 * 1024;

export const isAllowedSection = (s: string): s is UploadSection =>
  (ALLOWED_SECTIONS as readonly string[]).includes(s);

export interface ValidatedFile {
  ext: string;
  bytes: ArrayBuffer;
  size: number;
  mime: string;
}

export const validateFile = async (file: unknown): Promise<Result<ValidatedFile>> => {
  if (!(file instanceof File)) return err('No se recibió un archivo válido.');
  if (file.size === 0) return err('El archivo está vacío.');
  if (file.size > MAX_BYTES)
    return err(`El archivo supera ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`);
  if (!ALLOWED_MIME.has(file.type))
    return err(`Tipo no permitido: ${file.type}. Sólo JPG/PNG/WebP/AVIF.`);
  const ext = MIME_TO_EXT[file.type];
  if (!ext) return err('Extensión desconocida.');
  const bytes = await file.arrayBuffer();
  return ok({ ext, bytes, size: file.size, mime: file.type });
};

/**
 * Guarda el archivo en public/uploads/<section>/<uuid>.<ext>
 * Devuelve la URL pública servida por Astro (path absoluto desde /).
 */
export const saveFile = async (
  validated: ValidatedFile,
  section: UploadSection
): Promise<string> => {
  const filename = `${randomUUID()}.${validated.ext}`;
  const dir = join(process.cwd(), 'public', 'uploads', section);
  await mkdir(dir, { recursive: true });
  const fullPath = join(dir, filename);
  await writeFile(fullPath, new Uint8Array(validated.bytes));
  return `/uploads/${section}/${filename}`;
};

/**
 * Valida si una URL es interna y apunta a un upload nuestro.
 */
export const isUploadUrl = (url: string): boolean => {
  if (!url) return false;
  if (!url.startsWith('/uploads/')) return false;
  // No permitir traversal
  if (url.includes('..')) return false;
  // Path razonable: /uploads/<section>/<filename>
  const parts = url.split('/').filter(Boolean);
  if (parts.length !== 3) return false;
  if (!isAllowedSection(parts[1]!)) return false;
  return true;
};
