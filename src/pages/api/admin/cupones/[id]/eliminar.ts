import type { APIRoute } from 'astro';
import { requireAdmin, adminRedirect } from '../../../../../lib/admin-guard.ts';
import { deleteCoupon, getCouponById } from '../../../../../lib/queries.ts';

export const POST: APIRoute = async (ctx) => {
  const guard = requireAdmin(ctx);
  if (guard) return guard;

  const id = ctx.params.id;
  if (!id) return adminRedirect('/admin/cupones', false, 'ID inválido.');

  const c = await getCouponById(id);
  if (!c) return adminRedirect('/admin/cupones', false, 'Cupón no encontrado.');

  try {
    await deleteCoupon(id);
  } catch (err) {
    console.error('deleteCoupon fallo:', err);
    return adminRedirect('/admin/cupones', false, 'No se pudo eliminar.');
  }

  return adminRedirect('/admin/cupones', true, `Cupón "${c.code}" eliminado.`);
};
