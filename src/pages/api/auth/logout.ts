import type { APIRoute } from 'astro';
import { SESSION_COOKIE, destroySession } from '../../../lib/auth.ts';
import { isSameOrigin } from '../../../lib/csrf.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isSameOrigin(request)) {
    return new Response('Forbidden', { status: 403 });
  }

  const sid = cookies.get(SESSION_COOKIE)?.value;
  if (sid) {
    await destroySession(sid);
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return new Response(null, {
    status: 302,
    headers: { Location: '/' },
  });
};

export const GET: APIRoute = () =>
  new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  });
