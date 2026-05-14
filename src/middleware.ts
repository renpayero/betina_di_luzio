import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, getSession } from './lib/auth.ts';

const setSecurityHeaders = (res: Response): void => {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
};

export const onRequest = defineMiddleware(async (context, next) => {
  const cookie = context.cookies.get(SESSION_COOKIE);
  const sessionId = cookie?.value;

  if (sessionId) {
    const result = await getSession(sessionId);
    if (result) {
      context.locals.user = result.user;
      context.locals.session = result.session;
    } else {
      context.cookies.delete(SESSION_COOKIE, { path: '/' });
    }
  }

  const { pathname } = context.url;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdmin = context.locals.user?.role === 'admin';

  if (isAdminRoute && !isAdmin) {
    const target = encodeURIComponent(pathname + context.url.search);
    const res = context.redirect(`/login?next=${target}`, 302);
    setSecurityHeaders(res);
    return res;
  }

  if (pathname === '/login' && isAdmin) {
    const res = context.redirect('/admin', 302);
    setSecurityHeaders(res);
    return res;
  }

  const res = await next();
  setSecurityHeaders(res);
  return res;
});
