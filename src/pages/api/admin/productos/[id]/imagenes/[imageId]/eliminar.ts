import type { APIRoute } from 'astro';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { requireAdmin, adminRedirect } from '../../../../../../../lib/admin-guard.ts';
import {
  deleteProductImage,
  getProductImageById,
} from '../../../../../../../lib/queries.ts';
import { isUploadUrl } from '../../../../../../../lib/upload.ts';

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

  const removed = await deleteProductImage(imageId);
  if (!removed)
    return adminRedirect(
      `/admin/productos/${id}/editar`,
      false,
      'No se pudo eliminar.'
    );

  // Borrar archivo del filesystem si es un upload nuestro.
  if (isUploadUrl(removed.url)) {
    const rel = removed.url.replace(/^\//, '');
    const full = join(process.cwd(), 'public', rel);
    try {
      await unlink(full);
    } catch {
      // Si el archivo ya no existe, no es un error fatal.
    }
  }

  return adminRedirect(
    `/admin/productos/${id}/editar`,
    true,
    'Imagen eliminada.'
  );
};
