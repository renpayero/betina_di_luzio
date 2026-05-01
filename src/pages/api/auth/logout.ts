import type { APIRoute } from 'astro';
import { SESSION_COOKIE, destroySession } from '../../../lib/auth.ts';

export const POST: APIRoute = async ({ cookies }) => {
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
