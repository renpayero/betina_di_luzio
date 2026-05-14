import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../lib/admin-guard.ts';
import { getAdminProductById, updateProduct } from '../../../../../lib/queries.ts';
import { parseInt10 } from '../../../../../lib/validation.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/stock', false, 'ID inválido.');
  const product = await getAdminProductById(id);
  if (!product) return adminRedirect('/admin/stock', false, 'Producto no encontrado.');

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect('/admin/stock', false, 'Formato inválido.');
  }

  const stock = parseInt10(form.get('stock'));
  if (stock === null || stock < 0 || stock > 9999)
    return adminRedirect('/admin/stock', false, 'Stock inválido (0-9999).');

  try {
    await updateProduct(id, { stock });
  } catch (err) {
    console.error('stock update fallo:', err);
    return adminRedirect('/admin/stock', false, 'No se pudo actualizar el stock.');
  }

  return adminRedirect(
    '/admin/stock',
    true,
    `Stock de "${product.name}" → ${stock}.`
  );
};
