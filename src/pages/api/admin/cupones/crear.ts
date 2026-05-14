import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../lib/admin-guard.ts';
import {
  createCoupon,
  getCategoryById,
  getCouponByCode,
} from '../../../../lib/queries.ts';
import {
  trim,
  parseInt10,
  parseBool,
  parseDate,
  requireOneOf,
} from '../../../../lib/validation.ts';

const KINDS = ['percent', 'fixed', 'free_shipping'] as const;
const SCOPES = ['all', 'category', 'products'] as const;
const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  let form: FormData;
  try {
    form = await ctx.request.formData();
  } catch {
    return adminRedirect('/admin/cupones/nuevo', false, 'Formato inválido.');
  }

  const back = (msg: string) => adminRedirect('/admin/cupones/nuevo', false, msg);

  const code = trim(form.get('code')).toUpperCase();
  if (!CODE_RE.test(code))
    return back('Código inválido: 3-32 caracteres, sólo A-Z/0-9/-/_.');
  const exists = await getCouponByCode(code);
  if (exists) return back(`El código "${code}" ya existe.`);

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
  if (minPurchase < 0) return back('Compra mínima inválida.');

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
    await createCoupon({
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
    console.error('createCoupon fallo:', err);
    return back('No se pudo crear el cupón.');
  }

  return adminRedirect('/admin/cupones', true, `Cupón "${code}" creado.`);
};
