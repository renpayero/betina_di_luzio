import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../lib/admin-guard.ts';
import { deleteCategory, getCategoryById } from '../../../../../lib/queries.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/categorias', false, 'ID inválido.');

  const cat = await getCategoryById(id);
  if (!cat) return adminRedirect('/admin/categorias', false, 'No encontrada.');

  const result = await deleteCategory(id);
  if (!result.ok) return adminRedirect('/admin/categorias', false, result.reason);

  return adminRedirect(
    '/admin/categorias',
    true,
    `Categoría "${cat.name}" eliminada.`
  );
};
