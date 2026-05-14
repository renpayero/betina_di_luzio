import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../../lib/admin-guard.ts';
import {
  addProductImage,
  getAdminProductById,
} from '../../../../../../lib/queries.ts';
import { isUploadUrl } from '../../../../../../lib/upload.ts';
import { trim } from '../../../../../../lib/validation.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/productos', false, 'ID inválido.');

  const product = await getAdminProductById(id);
  if (!product)
    return adminRedirect('/admin/productos', false, 'Producto no encontrado.');

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

  const back = (msg: string) =>
    adminRedirect(`/admin/productos/${id}/editar`, false, msg);

  const url = trim(form.get('imageUrl'));
  if (!url) return back('No se recibió la imagen.');
  if (!isUploadUrl(url)) return back('URL de imagen inválida.');

  const altRaw = trim(form.get('alt'));
  const alt = altRaw || `${product.name} — imagen`;

  try {
    await addProductImage({
      productId: id,
      url,
      alt,
    });
  } catch (err) {
    console.error('addProductImage fallo:', err);
    return back('No se pudo agregar la imagen.');
  }

  return adminRedirect(
    `/admin/productos/${id}/editar`,
    true,
    `Imagen agregada a "${product.name}".`
  );
};
