import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../lib/admin-guard.ts';
import { removeCustomColor } from '../../../../lib/queries.ts';
import { trim } from '../../../../lib/validation.ts';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init?.headers ?? {}),
    },
  });

const HEX_RE = /^#[0-9A-F]{6}$/;

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return json({ ok: false, error: 'Formato inválido.' }, { status: 400 });
  }

  const hex = trim(form.get('hex')).toUpperCase();
  if (!HEX_RE.test(hex))
    return json({ ok: false, error: 'Color inválido.' }, { status: 400 });

  try {
    const removed = await removeCustomColor(hex);
    return json({ ok: removed, hex });
  } catch (e) {
    console.error('[custom-color] remove fallo:', e);
    return json(
      { ok: false, error: 'No se pudo eliminar el color.' },
      { status: 500 }
    );
  }
};
