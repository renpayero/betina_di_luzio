import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../lib/admin-guard.ts';
import {
  getAdminProductById,
  getAdminProductSkus,
  getAdminProductSlugs,
  getCategoryById,
  updateProduct,
} from '../../../../../lib/queries.ts';
import {
  trim,
  optTrim,
  parseInt10,
  parseBool,
  parseCheckbox,
  parseList,
  parseHexColors,
  requireText,
} from '../../../../../lib/validation.ts';
import { slugFromName } from '../../../../../lib/sku.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/productos', false, 'ID inválido.');

  const current = await getAdminProductById(id);
  if (!current) return adminRedirect('/admin/productos', false, 'Producto no encontrado.');

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect(`/admin/productos/${id}/editar`, false, 'Formato inválido.');
  }

  const back = (msg: string) =>
    adminRedirect(`/admin/productos/${id}/editar`, false, msg);

  const name = trim(form.get('name'));
  const nameOk = requireText(name, 'Nombre', 2, 100);
  if (!nameOk.ok) return back(nameOk.error);

  const categoryId = trim(form.get('categoryId'));
  const cat = await getCategoryById(categoryId);
  if (!cat) return back('Categoría inválida.');

  const price = parseInt10(form.get('price'));
  if (price === null || price < 0) return back('Precio inválido.');

  const oldPriceRaw = parseInt10(form.get('oldPrice'));
  const oldPrice = oldPriceRaw && oldPriceRaw > 0 ? oldPriceRaw : null;

  const stock = parseInt10(form.get('stock')) ?? 0;
  const minStock = parseInt10(form.get('minStock')) ?? 2;

  const statusRaw = trim(form.get('status'));
  const statusAllowed = ['new', 'sale', 'bestseller'] as const;
  const status = (statusAllowed as readonly string[]).includes(statusRaw)
    ? (statusRaw as (typeof statusAllowed)[number])
    : null;

  const materials = trim(form.get('materials'));
  if (materials.length < 2) return back('Materiales requeridos.');

  const description = trim(form.get('description'));
  if (description.length < 10) return back('Descripción muy corta.');

  const placeholder = trim(form.get('placeholder'));
  if (placeholder.length < 2) return back('Placeholder requerido.');

  const sizes = parseList(form.get('sizes'));
  const colors = parseHexColors(form.get('colors'));
  const isFeatured = parseCheckbox(form, 'isFeatured');
  const isPublished = parseBool(form.get('isPublished'));
  const sortOrder = parseInt10(form.get('sortOrder')) ?? 0;

  const slugRaw = optTrim(form.get('slug')) ?? slugFromName(name);
  if (slugRaw !== current.slug) {
    const slugs = await getAdminProductSlugs();
    if (slugs.includes(slugRaw))
      return back(`El slug "${slugRaw}" ya existe.`);
  }

  const skuRaw = optTrim(form.get('sku'));
  const sku = skuRaw ? skuRaw.toUpperCase() : null;
  if (sku && sku !== current.sku) {
    const skus = await getAdminProductSkus();
    if (skus.includes(sku)) return back(`El SKU "${sku}" ya existe.`);
  }

  try {
    await updateProduct(id, {
      slug: slugRaw,
      sku,
      name,
      categoryId,
      price,
      oldPrice,
      status,
      stock,
      minStock,
      materials,
      description,
      placeholder,
      colors,
      sizes,
      isFeatured,
      isPublished,
      sortOrder,
    });
  } catch (err) {
    console.error('updateProduct fallo:', err);
    return back('No se pudo actualizar el producto.');
  }

  return adminRedirect('/admin/productos', true, `Producto "${name}" actualizado.`);
};
