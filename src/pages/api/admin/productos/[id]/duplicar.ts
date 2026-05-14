import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../lib/admin-guard.ts';
import {
  createProduct,
  getAdminProductById,
  getAdminProductIds,
  getAdminProductSkus,
  getAdminProductSlugs,
} from '../../../../../lib/queries.ts';
import { nextProductId, nextSku } from '../../../../../lib/sku.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/productos', false, 'ID inválido.');

  const src = await getAdminProductById(id);
  if (!src)
    return adminRedirect('/admin/productos', false, 'Producto no encontrado.');

  const [ids, slugs, skus] = await Promise.all([
    getAdminProductIds(),
    getAdminProductSlugs(),
    getAdminProductSkus(),
  ]);

  const newId = nextProductId(ids);
  let newSlug = `${src.slug}-copia`;
  let i = 2;
  while (slugs.includes(newSlug)) {
    newSlug = `${src.slug}-copia-${i++}`;
  }
  const newSku = nextSku(src.categoryId, skus);

  try {
    await createProduct({
      id: newId,
      slug: newSlug,
      sku: newSku,
      name: `${src.name} (copia)`,
      categoryId: src.categoryId,
      price: src.price,
      oldPrice: src.oldPrice ?? null,
      status: src.status ?? null,
      stock: 0,
      minStock: src.minStock,
      materials: src.materials,
      description: src.description,
      placeholder: src.placeholder,
      colors: src.colors,
      sizes: src.sizes,
      isFeatured: false,
      isPublished: false,
      sortOrder: src.sortOrder + 1,
    });
  } catch (err) {
    console.error('duplicateProduct fallo:', err);
    return adminRedirect(
      '/admin/productos',
      false,
      'No se pudo duplicar el producto.'
    );
  }

  return adminRedirect(
    `/admin/productos/${newId}/editar`,
    true,
    `Duplicado como "${src.name} (copia)" en borrador.`
  );
};
