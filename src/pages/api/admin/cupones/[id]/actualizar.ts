import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../lib/admin-guard.ts';
import {
  getCategoryById,
  getCouponByCode,
  getCouponById,
  updateCoupon,
} from '../../../../../lib/queries.ts';
import {
  trim,
  parseInt10,
  parseBool,
  parseDate,
  requireOneOf,
} from '../../../../../lib/validation.ts';

const KINDS = ['percent', 'fixed', 'free_shipping'] as const;
const SCOPES = ['all', 'category', 'products'] as const;
const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/cupones', false, 'ID inválido.');
  const current = await getCouponById(id);
  if (!current) return adminRedirect('/admin/cupones', false, 'Cupón no encontrado.');

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect(`/admin/cupones/${id}/editar`, false, 'Formato inválido.');
  }

  const back = (msg: string) =>
    adminRedirect(`/admin/cupones/${id}/editar`, false, msg);

  const code = trim(form.get('code')).toUpperCase();
  if (!CODE_RE.test(code)) return back('Código inválido.');
  if (code !== current.code) {
    const exists = await getCouponByCode(code);
    if (exists) return back(`El código "${code}" ya existe.`);
  }

  const kindOk = requireOneOf(trim(form.get('kind')), 'Tipo', KINDS);
  if (!kindOk.ok) return back(kindOk.error);

  const scopeOk = requireOneOf(trim(form.get('scope')), 'Aplicación', SCOPES);
  if (!scopeOk.ok) return back(scopeOk.error);

  const value = parseInt10(form.get('value')) ?? 0;
  if (kindOk.value === 'percent' && (value <= 0 || value > 100))
    return back('Porcentaje debe estar entre 1 y 100.');
  if (kindOk.value === 'fixed' && value <= 0)
    return back('Monto fijo debe ser mayor a 0.');

  const minPurchase = parseInt10(form.get('minPurchase')) ?? 0;
  const expiresAt = parseDate(form.get('expiresAt'));
  const maxUses = parseInt10(form.get('maxUses'));
  const isActive = parseBool(form.get('isActive'));

  let categoryId: string | null = null;
  if (scopeOk.value === 'category') {
    categoryId = trim(form.get('categoryId'));
    const cat = await getCategoryById(categoryId);
    if (!cat) return back('Para alcance "categoría" hay que elegir una válida.');
  }

  try {
    await updateCoupon(id, {
      code,
      kind: kindOk.value,
      value,
      minPurchase,
      scope: scopeOk.value,
      categoryId,
      expiresAt,
      maxUses,
      isActive,
    });
  } catch (err) {
    console.error('updateCoupon fallo:', err);
    return back('No se pudo actualizar.');
  }

  return adminRedirect('/admin/cupones', true, `Cupón "${code}" actualizado.`);
};
