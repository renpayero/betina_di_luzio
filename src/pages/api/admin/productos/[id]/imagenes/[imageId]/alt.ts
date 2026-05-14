import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../../../lib/admin-guard.ts';
import {
  getProductImageById,
  updateProductImageAlt,
} from '../../../../../../../lib/queries.ts';
import { trim } from '../../../../../../../lib/validation.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  const imageId = ctx.params.imageId;
  if (!id || !imageId)
    return adminRedirect('/admin/productos', false, 'IDs inválidos.');

  const img = await getProductImageById(imageId);
  if (!img || img.productId !== id)
    return adminRedirect(
      `/admin/productos/${id}/editar`,
      false,
      'Imagen no encontrada.'
    );

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect(
      `/admin/productos/${id}/editar`,
      false,
      'Formato inválido.'
    );
  }

  const alt = trim(form.get('alt'));
  if (alt.length < 2 || alt.length > 160)
    return adminRedirect(
      `/admin/productos/${id}/editar`,
      false,
      'Alt entre 2 y 160 caracteres.'
    );

  await updateProductImageAlt(imageId, alt);
  return adminRedirect(
    `/admin/productos/${id}/editar`,
    true,
    'Alt actualizado.'
  );
};
