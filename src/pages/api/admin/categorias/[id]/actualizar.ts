import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../lib/admin-guard.ts';
import {
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
} from '../../../../../lib/queries.ts';
import {
  trim,
  parseInt10,
  requireText,
  requireSlug,
} from '../../../../../lib/validation.ts';
import { isUploadUrl } from '../../../../../lib/upload.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/categorias', false, 'ID inválido.');
  const current = await getCategoryById(id);
  if (!current) return adminRedirect('/admin/categorias', false, 'Categoría no encontrada.');

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect(`/admin/categorias/${id}/editar`, false, 'Formato inválido.');
  }

  const back = (msg: string) =>
    adminRedirect(`/admin/categorias/${id}/editar`, false, msg);

  const name = trim(form.get('name'));
  const nameOk = requireText(name, 'Nombre', 2, 60);
  if (!nameOk.ok) return back(nameOk.error);

  const slugInput = trim(form.get('slug')) || current.slug;
  const slugOk = requireSlug(slugInput, 'Slug');
  if (!slugOk.ok) return back(slugOk.error);
  if (slugOk.value !== current.slug) {
    const exists = await getCategoryBySlug(slugOk.value);
    if (exists) return back(`El slug "${slugOk.value}" ya existe.`);
  }

  const blurb = trim(form.get('blurb'));
  const blurbOk = requireText(blurb, 'Descripción', 5, 120);
  if (!blurbOk.ok) return back(blurbOk.error);

  const sortOrder = parseInt10(form.get('sortOrder')) ?? current.sortOrder;

  const imageUrlRaw = trim(form.get('imageUrl'));
  if (imageUrlRaw && !isUploadUrl(imageUrlRaw))
    return back('URL de imagen inválida (debe ser una subida).');
  const imageUrl = imageUrlRaw || null;

  try {
    await updateCategory(id, { name, slug: slugOk.value, blurb, imageUrl, sortOrder });
  } catch (err) {
    console.error('updateCategory fallo:', err);
    return back('No se pudo actualizar.');
  }

  return adminRedirect('/admin/categorias', true, `Categoría "${name}" actualizada.`);
};
