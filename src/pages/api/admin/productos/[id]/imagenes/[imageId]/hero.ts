import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../../../lib/admin-guard.ts';
import {
  getProductImageById,
  setProductHeroImage,
} from '../../../../../../../lib/queries.ts';

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

  const ok = await setProductHeroImage(id, imageId);
  if (!ok)
    return adminRedirect(
      `/admin/productos/${id}/editar`,
      false,
      'No se pudo marcar como hero.'
    );

  return adminRedirect(
    `/admin/productos/${id}/editar`,
    true,
    'Imagen principal actualizada.'
  );
};
