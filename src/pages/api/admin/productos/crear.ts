import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../lib/admin-guard.ts';
import {
  createProduct,
  getAdminProductIds,
  getAdminProductSkus,
  getAdminProductSlugs,
  getCategoryById,
} from '../../../../lib/queries.ts';
import {
  trim,
  optTrim,
  parseInt10,
  parseBool,
  parseCheckbox,
  parseList,
  parseHexColors,
  requireText,
} from '../../../../lib/validation.ts';
import { nextProductId, nextSku, slugFromName } from '../../../../lib/sku.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect('/admin/productos/nuevo', false, 'Formato inválido.');
  }

  const name = trim(form.get('name'));
  const nameOk = requireText(name, 'Nombre', 2, 100);
  if (!nameOk.ok)
    return adminRedirect('/admin/productos/nuevo', false, nameOk.error);

  const categoryId = trim(form.get('categoryId'));
  const cat = await getCategoryById(categoryId);
  if (!cat)
    return adminRedirect('/admin/productos/nuevo', false, 'Categoría inválida.');

  const price = parseInt10(form.get('price'));
  if (price === null || price < 0)
    return adminRedirect('/admin/productos/nuevo', false, 'Precio inválido.');

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
  if (materials.length < 2)
    return adminRedirect('/admin/productos/nuevo', false, 'Materiales requeridos.');

  const description = trim(form.get('description'));
  if (description.length < 10)
    return adminRedirect('/admin/productos/nuevo', false, 'Descripción muy corta.');

  const placeholder = trim(form.get('placeholder'));
  if (placeholder.length < 2)
    return adminRedirect('/admin/productos/nuevo', false, 'Placeholder requerido.');

  const sizes = parseList(form.get('sizes'));
  const colors = parseHexColors(form.get('colors'));

  const isFeatured = parseCheckbox(form, 'isFeatured');
  const isPublished = parseBool(form.get('isPublished'));
  const sortOrder = parseInt10(form.get('sortOrder')) ?? 0;

  const slugRaw = optTrim(form.get('slug')) ?? slugFromName(name);
  const slugs = await getAdminProductSlugs();
  if (slugs.includes(slugRaw))
    return adminRedirect('/admin/productos/nuevo', false, `El slug "${slugRaw}" ya existe.`);

  const skuRaw = optTrim(form.get('sku'));
  let sku: string | null = skuRaw ? skuRaw.toUpperCase() : null;
  const existingSkus = await getAdminProductSkus();
  if (sku && existingSkus.includes(sku))
    return adminRedirect('/admin/productos/nuevo', false, `El SKU "${sku}" ya existe.`);
  if (!sku) sku = nextSku(categoryId, existingSkus);

  const ids = await getAdminProductIds();
  const id = nextProductId(ids);

  try {
    await createProduct({
      id,
      slug: slugRaw,
      sku,
      name,
      categoryId,
      price,
      oldPrice: oldPrice ?? null,
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
    console.error('createProduct fallo:', err);
    return adminRedirect('/admin/productos/nuevo', false, 'No se pudo crear el producto.');
  }

  return adminRedirect('/admin/productos', true, `Producto "${name}" creado.`);
};
