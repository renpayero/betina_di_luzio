import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../lib/admin-guard.ts';
import { addCustomColor, getCustomColors } from '../../../../lib/queries.ts';
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

  const name = trim(form.get('name')).slice(0, 40);
  if (name.length < 1)
    return json({ ok: false, error: 'Necesitamos un nombre.' }, { status: 400 });

  const userId = ctx.locals.user?.id ?? null;

  try {
    const row = await addCustomColor({ hex, name, createdBy: userId });
    if (!row) {
      // Ya existía. Buscamos el nombre actual para mostrárselo al usuario.
      const all = await getCustomColors();
      const existing = all.find((c) => c.hex === hex);
      return json(
        {
          ok: false,
          error: existing
            ? `Ese color ya está en el catálogo como "${existing.name}".`
            : 'Ese color ya existe.',
          duplicate: true,
          existingName: existing?.name ?? null,
        },
        { status: 409 }
      );
    }
    return json({ ok: true, color: row });
  } catch (e) {
    console.error('[custom-color] add fallo:', e);
    return json(
      { ok: false, error: 'No se pudo guardar el color.' },
      { status: 500 }
    );
  }
};
