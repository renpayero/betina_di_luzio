import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../lib/admin-guard.ts';
import { deleteProduct, getAdminProductById } from '../../../../../lib/queries.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/productos', false, 'ID inválido.');

  const product = await getAdminProductById(id);
  if (!product)
    return adminRedirect('/admin/productos', false, 'Producto no encontrado.');

  try {
    await deleteProduct(id);
  } catch (err) {
    console.error('deleteProduct fallo:', err);
    return adminRedirect(
      '/admin/productos',
      false,
      'No se pudo eliminar (¿tiene imágenes o referencias?).'
    );
  }

  return adminRedirect(
    '/admin/productos',
    true,
    `Producto "${product.name}" eliminado.`
  );
};
