import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../lib/admin-guard.ts';
import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
} from '../../../../lib/queries.ts';
import {
  trim,
  parseInt10,
  requireText,
  requireSlug,
} from '../../../../lib/validation.ts';
import { isUploadUrl } from '../../../../lib/upload.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect('/admin/categorias/nueva', false, 'Formato inválido.');
  }

  const back = (msg: string) => adminRedirect('/admin/categorias/nueva', false, msg);

  const name = trim(form.get('name'));
  const nameOk = requireText(name, 'Nombre', 2, 60);
  if (!nameOk.ok) return back(nameOk.error);

  const idRaw = trim(form.get('id'));
  const idOk = requireSlug(idRaw, 'ID');
  if (!idOk.ok) return back(idOk.error);
  if (await getCategoryById(idOk.value)) return back(`El ID "${idOk.value}" ya existe.`);

  const slugInput = trim(form.get('slug')) || idOk.value;
  const slugOk = requireSlug(slugInput, 'Slug');
  if (!slugOk.ok) return back(slugOk.error);
  if (await getCategoryBySlug(slugOk.value))
    return back(`El slug "${slugOk.value}" ya existe.`);

  const blurb = trim(form.get('blurb'));
  const blurbOk = requireText(blurb, 'Descripción', 5, 120);
  if (!blurbOk.ok) return back(blurbOk.error);

  const sortOrder =
    parseInt10(form.get('sortOrder')) ??
    (await getCategories()).reduce((a, b) => Math.max(a, b.sortOrder + 1), 1);

  const imageUrlRaw = trim(form.get('imageUrl'));
  if (imageUrlRaw && !isUploadUrl(imageUrlRaw))
    return back('URL de imagen inválida (debe ser una subida).');
  const imageUrl = imageUrlRaw || null;

  try {
    await createCategory({
      id: idOk.value,
      slug: slugOk.value,
      name,
      blurb,
      imageUrl,
      sortOrder,
    });
  } catch (err) {
    console.error('createCategory fallo:', err);
    return back('No se pudo crear la categoría.');
  }

  return adminRedirect('/admin/categorias', true, `Categoría "${name}" creada.`);
};
