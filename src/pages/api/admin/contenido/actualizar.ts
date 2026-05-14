import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../lib/admin-guard.ts';
import { getContentBlock, updateContentValue } from '../../../../lib/queries.ts';
import { invalidateContentCache } from '../../../../lib/content.ts';
import { trim } from '../../../../lib/validation.ts';
import { isUploadUrl } from '../../../../lib/upload.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const section = ctx.url.searchParams.get('section') ?? 'home';
  const userId = ctx.locals.user?.id ?? null;
  const backTo = `/admin/contenido?section=${section}`;

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect(backTo, false, 'Formato inválido.');
  }

  let saved = 0;
  let skipped = 0;
  // Para booleans (checkboxes): hidden=false + checkbox=true => getAll resuelve ambos.
  // Detectamos por key.endsWith('.enabled'): usar getAll → incluye "true" cuando está marcado.
  const seen = new Set<string>();
  for (const [key, raw] of form.entries()) {
    if (typeof raw !== 'string') continue;
    if (key.length > 80) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    const block = await getContentBlock(key);
    if (!block) {
      skipped++;
      continue;
    }
    let value: string;
    if (key.endsWith('.enabled')) {
      const all = form.getAll(key).filter((v) => typeof v === 'string') as string[];
      value = all.includes('true') ? 'true' : 'false';
    } else {
      value = trim(raw);
    }
    if (block.kind === 'image') {
      if (value.length > 0 && !isUploadUrl(value)) {
        skipped++;
        continue;
      }
    } else if (!key.endsWith('.enabled')) {
      if (value.length === 0 || value.length > 2000) {
        skipped++;
        continue;
      }
    }
    if (value === block.value) continue;
    await updateContentValue(key, value, userId);
    saved++;
  }

  if (saved > 0) invalidateContentCache();

  const msg =
    saved === 0
      ? skipped > 0
        ? 'No se guardó ningún cambio (campos inválidos).'
        : 'No había cambios para guardar.'
      : `${saved} ${saved === 1 ? 'cambio guardado' : 'cambios guardados'}.`;

  return adminRedirect(backTo, saved > 0, msg);
};
