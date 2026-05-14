import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/admin-guard.ts';
import {
  isAllowedSection,
  saveFile,
  validateFile,
  type UploadSection,
} from '../../../lib/upload.ts';
import { trim } from '../../../lib/validation.ts';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init?.headers ?? {}),
    },
  });

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return json({ ok: false, error: 'Formato inválido.' }, { status: 400 });
  }

  const sectionRaw = trim(form.get('section')) || 'generic';
  if (!isAllowedSection(sectionRaw))
    return json({ ok: false, error: 'Sección inválida.' }, { status: 400 });
  const section: UploadSection = sectionRaw;

  const file = form.get('file');
  const validated = await validateFile(file);
  if (!validated.ok) {
    const status = validated.error.includes('Tipo no permitido')
      ? 415
      : validated.error.includes('supera')
        ? 413
        : 400;
    return json({ ok: false, error: validated.error }, { status });
  }

  try {
    const url = await saveFile(validated.value, section);
    return json({ ok: true, url, size: validated.value.size });
  } catch (e) {
    console.error('[upload] fallo al guardar:', e);
    return json(
      { ok: false, error: 'No se pudo guardar el archivo.' },
      { status: 500 }
    );
  }
};

export const GET: APIRoute = () =>
  json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
