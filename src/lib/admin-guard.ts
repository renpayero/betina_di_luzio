import type { APIContext } from 'astro';
import { isSameOrigin } from './csrf.ts';

/**
 * Devuelve null si el request es admin válido y same-origin.
 * Devuelve la Response a returnar (403) si no.
 * Defensa en profundidad: aunque el middleware ya bloquea /admin para no-admins,
 * los endpoints /api/admin/* podrían recibir requests directos.
 */
export const requireAdmin = (ctx: APIContext): Response | null => {
  if (!isSameOrigin(ctx.request)) {
    return new Response('Forbidden', { status: 403 });
  }
  const user = ctx.locals.user;
  if (!user || user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  return null;
};

export const adminRedirect = (
  path: string,
  ok: boolean,
  msg: string
): Response => {
  const qs = new URLSearchParams({ [ok ? 'ok' : 'err']: '1', msg });
  const sep = path.includes('?') ? '&' : '?';
  return new Response(null, {
    status: 303,
    headers: { Location: `${path}${sep}${qs.toString()}` },
  });
};
